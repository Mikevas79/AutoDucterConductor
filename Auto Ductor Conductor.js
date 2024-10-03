/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/search', 'N/ui/serverWidget', 'N/ui/message', 'N/error'], function(record, search, serverWidget, message, error) {

    function beforeLoad(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY) {
            try {
                var newRecord = context.newRecord;
                var form = context.form;

                // Set the taxschedule field to internal ID 4 before the page loads
                newRecord.setValue({
                    fieldId: 'taxschedule',
                    value: 4  // Internal ID should be a number, not a string
                });

                // Add the custom field "Auto-Build" to the form
                var autobuildfield = form.addField({
                    id: 'custpage_auto_build', // Make sure this ID is unique and follows your naming conventions
                    type: serverWidget.FieldType.TEXT,
                    label: 'Want this Automatically Built? --- Type: "Y"'
                });

                autobuildfield.defaultValue = 'Y';

                // Display an informational message on the form
                form.addPageInitMessage({
                    type: message.Type.INFORMATION,
                    title: 'Tax Schedule Set',
                    message: 'Tax Schedule has been set to internal ID 4 (TAXABLE) before the page loads.  Admins + Accountants can change this if needed before saving',
                    duration: 7000  //7 seconds untill it collapses
                });

                // Check if the subsidiary ID is 2 and display a warning message if true
                var blsubsidiaryId = newRecord.getValue({fieldId: 'subsidiary'});
                var bltargetsSubsidiaryId = 2
                if (Number(blsubsidiaryId) === bltargetsSubsidiaryId) {
                    form.addPageInitMessage({
                        type: message.Type.WARNING,
                        title: 'RCD ONLY - Auto-Build Feature (For New Ducts)',
                        message: 'The Item will Auto-Build ONLY IF Item ID follows the CORRECT Nameing Convention and "Want this Automatically Built?" Field is set to "Y".'
                    });

                    // Add the custom field "New Duct Instructions" to the form
                    var ductinstructions = form.addField({
                        id: 'custpage_duct_instructions', // Make sure this ID is unique and follows your naming conventions
                        type: serverWidget.FieldType.TEXTAREA,
                        label: 'Duct Instructions',
                        // container: 'custpage_classification_group' // Specify the ID of the field group
                    });

                    // Set the default value and adjust the size of the text area
                    ductinstructions.defaultValue = 'Enter Duct SKU Into ITEM NAME/NUMBER field - This is how your SKU should look character by character.\n \n 1)                     T,I,B,S,U,A,P               Each Letter is a different Duct Type \n 2 and 3)         10,13,14,16,18           Fabric Weight options \n 4)                     Y,C,B,G,T,W,O,D        Duct Color (REMEBER C = BLUE   D = DOG BLUE) \n 5 and 6)         02 to 60                      Duct Diameter (any 2 digit number to 60) \n 7)                     X                                 This separates the diameter and length (This needs to ba capitalized #ANDY) \n 8 and 9)         01 to 99                      Duct Length (Any 2 digit number) \n 10)                 N,B,C,G,O,R,W,Y         Wear strip Color (N = No Wear strip) \n 11 and 12)     WG,HC,BC,PL,SC       First Cuff options \n 13 and 14)    WG,HC,BC,PL,SC        Second Cuff Options \n 15)                 -                                    This separates the pitch from cuffs \n 16)                 3,4,6                             This is the duct pitch \n \n If you do not follow this, YOU WILL GET AN ERROR message';
                    ductinstructions.updateLayoutType({
                        layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE // Adjust as needed
                    });
                    ductinstructions.updateDisplaySize({
                        height: 15, // Number of rows visible in the text area
                        width: 120 // Number of characters visible per line
                    });

                    ductinstructions.updateDisplayType({
                        displayType: serverWidget.FieldDisplayType.DISABLED // Makes the field read-only
                    });
                }

            } catch (e) {
                form.addPageInitMessage({
                    type: message.Type.ERROR,
                    title: 'Error in Before Load Function',
                    message: e.message
                });
            }
        }
    }

// ***ITEM ENTRY CHECKS***

    /* This checks the User Inputted Item ID field to make sure it follows the correct duct types that we can make.
    This happens when you click submit, if you dont follow you will be sent to a netsuite error screen
    Breaking this down:
    Char 1 can be any of these Chars - [TIBSUAP]
    Chars 2 and 3 - (?:10|11|13|14|16|18)
    Char 4 - [YCBGTWOD] and so on...*/
    function beforeSubmit(context) {
        // Only perform validation on 'create' 'COPY' or 'EDIT' operations  (Edit due to once it throws an error, user is sent back to edit the item)
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.COPY || context.type === context.UserEventType.EDIT) {

        // //only allow people to submit if they follow the naming convention
        var newRecord = context.newRecord;
        var subsidiaryId = newRecord.getValue({fieldId: 'subsidiary'});
        var targetsSubsidiaryId = 2
        if (Number(subsidiaryId) === targetsSubsidiaryId) {
            // Check if "Auto-Build" field equals 'Y'
            var autoBuildValue = newRecord.getValue({ fieldId: 'custpage_auto_build' });
            if (autoBuildValue === 'Y') {
                var itemNameNumber = newRecord.getValue({ fieldId: 'itemid' }); // Adjust fieldId according to your record type

                // This is the line with the logic behind if the error screen is thrown if this line is not followed
                var regex = /^[TIBSUAP](?:10|11|13|14|16|18)[YCBGTWOD][0-6][0-9][X][0-9][0-9][NBCGORWY](?:WG|HC|BC|PL|SC){2,}-[2-8]$/;

                if (!regex.test(itemNameNumber)) {
                    log.debug({
                        title: 'No Matched',
                        details: 'Item name does not follow RCD naming convention'
                    });

                    // Tell netsuite to throw the error screen
                    throw error.create({
                        name: 'INVALID_ITEM_NAME',
                        message: 'Item name does not follow RCD naming convention',
                        notifyOff: false
                    });
                    }
                }
            }
        }
    }

    function afterSubmit(context) {
        if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {

            try {
                var newRecord = context.newRecord;

                // Retrieve the value of the "Auto-Build" field
                var autoBuildValue = newRecord.getValue({ fieldId: 'custpage_auto_build' });

                // Check if "Auto-Build" field equals 'Y'
                if (autoBuildValue === 'Y') {

                // Get the itemid field value
                var itemNameNumber = newRecord.getValue({ fieldId: 'itemid' });

                // Check if itemNameNumber is defined
                if (itemNameNumber) {
                    itemNameNumber = itemNameNumber.toUpperCase();

                    // Check if itemNameNumber is exactly 16 characters
                    if (itemNameNumber.length === 16) {
                        log.debug({
                            title: 'Processing Record',
                            details: 'Record Type: ' + newRecord.type + ', Record ID: ' + newRecord.id
                        });

                        // Make sure the subsidary is set to RCD (internal id = 2 for RCD)
                        var subsidiary = newRecord.getValue({ fieldId: 'subsidiary' });
                        log.debug({
                            title: 'Subsidiary Value',
                            details: 'Subsidiary Field Value: ' + subsidiary + ', Type: ' + typeof subsidiary
                        });

                        var targetSubsidiaryId = 2;
                        if (Number(subsidiary) === targetSubsidiaryId) {
                            var stockUnit = newRecord.getValue({ fieldId: 'stockunit' });
                            var purchaseUnit = newRecord.getValue({ fieldId: 'purchaseunit' });
                            var saleUnit = newRecord.getValue({ fieldId: 'saleunit' });
                            var consumptionUnit = newRecord.getValue({ fieldId: 'consumptionunit' });
                            var unitType = newRecord.getValue({ fieldId: 'unitstype' });
                            var baseUnit = newRecord.getValue({ fieldId: 'baseunit' });

                            log.debug({
                                title: 'Current Unit Values',
                                details: 'Stock Unit: ' + stockUnit + ', Purchase Unit: ' + purchaseUnit +
                                         ', Sale Unit: ' + saleUnit + ', Consumption Unit: ' + consumptionUnit +
                                         ', Unit Type: ' + unitType + ', Base Unit: ' + baseUnit
                            });

                            var eachUnitId = 1;
                            var lengthUomId = 2;
                            var widthUomId = 1;
                            var departmentId = 8;
                            var locationId = 2;

                            var cogsAccountId = 213;
                            var assetAccountId = 375;
                            var incomeAccountId = 54;
                            var gainLossAccountId = 211;

                            var classId;
                            if (itemNameNumber && itemNameNumber.length > 0) {
                                var ductTypeChar = itemNameNumber.charAt(0);
                                switch (ductTypeChar) {
                                    case 'B':
                                        classId = 34;
                                        break;
                                    case 'A':
                                    case 'U':
                                        classId = 30;
                                        break;
                                    case 'T':
                                        classId = 29;
                                        break;
                                    case 'P':
                                    case 'S':
                                        classId = 31;
                                        break;
                                    case 'I':
                                        classId = 32;
                                        break;
                                    default:
                                        classId = null;
                                        break;
                                }
                            }

                            if (itemNameNumber.charAt(0) === 'T') {
                                var secondAndThirdChars = parseInt(itemNameNumber.substring(1, 3), 10);
                                if (secondAndThirdChars > 10) {
                                    classId = 30;
                                }
                            }

                            // Add in all the values for each of the nessesary assembly build feilds
                            var updateValues = {
                                'itemid': itemNameNumber,
                                'stockunit': eachUnitId,
                                'purchaseunit': eachUnitId,
                                'saleunit': eachUnitId,
                                'consumptionunit': eachUnitId,
                                'unitstype': eachUnitId,
                                'baseunit': eachUnitId,
                                'custitem_length_uom': lengthUomId,
                                'custitem_width_uom': widthUomId,
                                'department': departmentId,
                                'location': locationId,
                                'cogsaccount': cogsAccountId,
                                'assetaccount': assetAccountId,
                                'incomeaccount': incomeAccountId,
                                'gainlossaccount': gainLossAccountId,
                                'class': classId,
                                'taxschedule': 4,
                                'autopreferredstocklevel': false,
                                'autoreorderpoint': false,
                                'autoleadtime': false,
                                'usebins': true,
                                'custitem_jcb_class_mark_up': 4.0
                            };

                            log.debug({
                                title: 'Update Values',
                                details: JSON.stringify(updateValues)
                            });

                            var needsUpdate = false;
                            if (stockUnit !== eachUnitId) needsUpdate = true;
                            if (purchaseUnit !== eachUnitId) needsUpdate = true;
                            if (saleUnit !== eachUnitId) needsUpdate = true;
                            if (consumptionUnit !== eachUnitId) needsUpdate = true;
                            if (unitType !== eachUnitId) needsUpdate = true;
                            if (baseUnit !== eachUnitId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'custitem_length_uom' }) !== lengthUomId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'custitem_width_uom' }) !== widthUomId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'department' }) !== departmentId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'location' }) !== locationId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'cogsaccount' }) !== cogsAccountId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'assetaccount' }) !== assetAccountId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'incomeaccount' }) !== incomeAccountId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'gainlossaccount' }) !== gainLossAccountId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'class' }) !== classId) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'taxschedule' }) !== 4) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'autopreferredstocklevel' }) !== false) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'autoreorderpoint' }) !== false) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'autoleadtime' }) !== false) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'usebins' }) !== true) needsUpdate = true;
                            if (newRecord.getValue({ fieldId: 'custitem_jcb_class_mark_up' }) !== 4.0) needsUpdate = true;

                            if (needsUpdate) {
                                record.submitFields({
                                    type: newRecord.type,
                                    id: newRecord.id,
                                    values: updateValues
                                });

                                log.debug({
                                    title: 'Updated Fields',
                                    details: 'Fields updated successfully.'
                                });
                            } else {
                                log.debug({
                                    title: 'No Update Needed',
                                    details: 'All fields are already set to the required values.'
                                });
                            }

                            // Create the description based on the SKU in the ItemId field provided
                            var ductTypeChar = itemNameNumber.charAt(0);

                            // Determine what type of branded duct this will be based on type
                            var description = '';
                            switch (ductTypeChar) {
                                case 'T':
                                case 'B':
                                case 'A':
                                case 'I':
                                    description += 'COOLFLEX™, ';
                                    break;
                                case 'S':
                                case 'P':
                                    description += 'DYNAFLEX™, ';
                                    break;
                            }

                            // Input Duct OZ in description
                            var fabweight = {
                                '10': '10OZ ',
                                '12': '12OZ ',
                                '13': '13OZ ',
                                '14': '14OZ ',
                                '16': '16OZ ',
                                '18': '18OZ ',
                            };
                            description += fabweight[itemNameNumber.substring(1,3)] || '';

                            // Determine Color of duct
                            var width = itemNameNumber.substring(4, 6);
                            var length = itemNameNumber.substring(7, 9);
                            var ductPitch = itemNameNumber.charAt(15);

                            var colorMap = {
                                'W': 'WHITE ',
                                'Y': 'YELLOW ',
                                'C': 'BLUE ',
                                'G': 'GREEN ',
                                'T': 'TAN ',
                                'O': 'ORANGE ',
                                'B': 'BLACK ',
                                'D': 'BLUE COATED '
                            };
                            description += colorMap[itemNameNumber.charAt(3)] || '';

                            // Determine the type of duct to add after color
                            var ductTypeMap = {
                                'S': 'SILICONE, ',
                                'A': 'BERRY AMENDMENT, ',
                                'B': 'BLOCKOUT, ',
                                'I': 'INSULATED, ',
                                'P': 'POLY WOVEN, ',
                                'T': 'TRANSLUCENT, '
                            };
                            description += ductTypeMap[itemNameNumber.charAt(0)] || '';

                            // Add the Length and Diameter of the duct
                            var additionalInfo = itemNameNumber.substring(4, 6) + '"X';
                            description += additionalInfo;

                            var additionalInfo2 = itemNameNumber.substring(7, 9) + "', ";
                            description += additionalInfo2;

                            // Add the Pitch
                            var additionalInfo3 = itemNameNumber.substring(15) + '" PITCH, ';
                            description += additionalInfo3;

                            // Determine the wearstrip type
                            var wearstripColorMap = {
                                'N': 'NO WEARSTRIP, ',
                                'B': 'BLACK WEARSTRIP, ',
                                'C': 'BLUE WEARSTRIP, ',
                                'G': 'GREEN WEARSTRIP, ',
                                'O': 'ORANGE WEARSTRIP, ',
                                'R': 'RED WEARSTRIP, ',
                                'W': 'WHITE WEARSTRIP, ',
                                'Y': 'YELLOW WEARSTRIP, '
                            };
                            description += wearstripColorMap[itemNameNumber.charAt(9)] || '';

                            // Determine the cuffs of both ends
                            var cuff1Map = {
                                'WG': 'WORMGEAR, ',
                                'HC': 'HOOP CUFF, ',
                                'BC': 'BELT CUFF, ',
                                'SC': 'SOFT CUFF, ',
                                'PL': 'PIN LOCK, ',
                                'RC': 'ROPE CUFF, '
                            };
                            description += cuff1Map[itemNameNumber.substring(10, 12)] || '';

                            var cuff2Map = {
                                'WG': 'WORMGEAR',
                                'HC': 'HOOP CUFF',
                                'BC': 'BELT CUFF',
                                'SC': 'SOFT CUFF',
                                'PL': 'PIN LOCK',
                                'RC': 'ROPE CUFF'
                            };
                            description += cuff2Map[itemNameNumber.substring(12, 14)] || '';

                            // Submit the description to netsuite
                            record.submitFields({
                                type: newRecord.type,
                                id: newRecord.id,
                                values: {
                                    'description': description,
                                    'custitem_jcb_diameter': width,
                                    'custitem_item_length': length,
                                    'custitem_duct_pitch': ductPitch
                                }
                            });

                            // Check to make sure the itemid/SKU is not missing
                            var itemId = newRecord.getValue({ fieldId: 'itemid' });
                            var internalId = newRecord.id;

                            if (!itemId) {
                                log.error({
                                    title: 'Item ID Missing',
                                    details: 'The assembly item does not have an itemid.'
                                });
                                return;
                            }
// *** BOM ***
                            try {
                                // Create BOM record
                                var bomRecord = record.create({
                                    type: record.Type.BOM,
                                    isDynamic: true
                                });
                    
                                bomName = itemId + ' Bom'

                                // Set BOM details
                                bomRecord.setValue({
                                    fieldId: 'name',
                                    value: bomName
                                });

                                // Set the subsidiary field to 2
                                bomRecord.setValue({
                                    fieldId: 'subsidiary',
                                    value: targetSubsidiaryId
                                });

                                // Save BOM record
                                var bomId = bomRecord.save();
                    
                                log.debug({
                                    title: 'BOM Created',
                                    details: 'BOM Record ID: ' + bomId + ', Name: ' + bomName
                                });

                                // Update BOM record with the internal ID for restricttoassemblies
                                record.submitFields({
                                    type: record.Type.BOM,
                                    id: bomId,
                                    values: {
                                        'availableforallassemblies': false,
                                        'restricttoassemblies': internalId,
                                        'masterdefault': true // Check masterdefault field
                                    }
                                });

                                // Load BOM in the assembly item
                                var bomattachment = record.load({
                                    type: record.Type.ASSEMBLY_ITEM,
                                    id: internalId,
                                });

                                //Set the bomid as the Attachment value
                                bomattachment.setSublistValue({
                                    sublistId: 'billofmaterials',
                                    fieldId: 'billofmaterials',
                                    line: 0,
                                    value: bomId
                                });

                                //Set it to master default
                                bomattachment.setSublistValue({
                                    sublistId: 'billofmaterials',
                                    fieldId: 'masterdefault',
                                    line: 0,
                                    value: true
                                });

                                //Save the bom attachement to the Assembly Build
                                bomattachment.save()

                                log.debug({
                                    title: 'BOM Attached',
                                    details: 'BOM with ID: ' + bomId + ' has been attached to Assembly Item ID: ' + internalId
                                });
// *** BOM REVISON ***                            
                                // Calculate the effective start date as the day before today
                                var today = new Date();
                                var dayBeforeToday = new Date(today);
                                dayBeforeToday.setDate(today.getDate() - 1);
                                var date = new Date();
                                var day = date.getDate();
                                var month = date.getMonth() + 1; // jan = 0
                                var year = date.getFullYear() % 100;  //2 digit year
                                var todaystring = month + '/' + day + '/' + year;

                                // Add a BOM revision
                                var bomRevisionRecord = record.create({
                                    type: record.Type.BOM_REVISION,
                                    isDynamic: true
                                });
                                
                                // Set the revision name to todays date
                                bomRevisionRecord.setValue({
                                    fieldId: 'name',
                                    value: 'revision ' + todaystring
                                });
                                
                                bomRevisionRecord.setValue({
                                    fieldId: 'billofmaterials',
                                    value: bomId
                                });
                                

                                // Set the effective start date on the BOM revision record (Yesterdays date)
                                bomRevisionRecord.setValue({
                                    fieldId: 'effectivestartdate',
                                    value: dayBeforeToday
                                });

                                // Save BOM revision record
                                var bomRevisionId = bomRevisionRecord.save();
                                
                                log.debug({
                                    title: 'BOM Revision Created',
                                    details: 'BOM Revision Record ID: ' + bomRevisionId + ', Name: revision'
                                });
                                
                                // Load BOM revision to add components
                                var bomRevision = record.load({
                                    type: record.Type.BOM_REVISION,
                                    id: bomRevisionId,
                                    isDynamic: true
                                });
                                
                                // Define all the componenets of the ItemId to be used in the revision
                                var fabric = '';
                                var ductTypeChar = itemNameNumber.charAt(0);
                                var fabricWeightChars = itemNameNumber.substring(1, 3);
                                var fabricColorChars = itemNameNumber.charAt(3);
                                var pitchChar = itemNameNumber.charAt(15);
                                var wearstripChar = itemNameNumber.charAt(9);
                                var cuffOneChars = itemNameNumber.substring(10,12);
                                var cuffTwoChars = itemNameNumber.substring(12,14);
                                var diameterChars = itemNameNumber.substring(4, 6);
                                var lengthChars = itemNameNumber.substring(7, 9);

                                if (ductTypeChar === 'T' || ductTypeChar === 'B' || ductTypeChar === 'A') {
                                    fabric += 'KS-';
                                }

                                if (ductTypeChar === 'I') {
                                    fabric += 'INSMAT-';
                                }

                                if (ductTypeChar === 'S') {
                                    fabric += 'SCN-';
                                }

                                if (ductTypeChar === 'U') {
                                    fabric += 'UL-';
                                }
                                
                                if (ductTypeChar === 'P') {
                                    fabric += 'PWF-';
                                }

                                //Logic for fabric weight
                                if (fabricWeightChars === '10') {
                                    fabric += '1000';
                                }

                                if (fabricWeightChars === '13') {
                                    fabric += '1300';
                                }

                                if (fabricWeightChars === '14') {
                                    fabric += '1400';
                                }
                                
                                if (fabricWeightChars === '16') {
                                    fabric += '1600';
                                }

                                if (fabricWeightChars === '18') {
                                    fabric += '1800';
                                }

                                var colorSuffixMap = {
                                    'B': '-BLK',
                                    'C': '-RBL',
                                    'G': '-GRN',
                                    'O': '-ORA',
                                    'R': '-RED',
                                    'W': '-WHT',
                                    'Y': '-YEL',
                                    'T': '-TAN'
                                };
                                fabric += colorSuffixMap[fabricColorChars] || '';
                                
                                var sizeSuffixMap = {
                                    '3': '-412',
                                    '4': '-538',
                                    '6': '-812',
                                    '7': '-812'
                                };
                                fabric += sizeSuffixMap[pitchChar] || '';

                                var blockoutending = {
                                    'B': '-BO',
                                };
                                fabric += blockoutending[ductTypeChar] || '';

                                // Find the internal ID of the item to be added to the BOM revision
                                var fabricItemId = getItemId(fabric);
                                if (!fabricItemId) {
                                    throw new Error('Fabric Item ' + fabric + ' not found.');
                                }

                                // Add Duct Fabric component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: fabricItemId
                                });

                                //Fabric Quantity Calculation
                                var fabricquantity = ((parseInt(diameterChars, 10) / 12) * parseInt(lengthChars, 10) * Math.PI * (1 / (parseInt(pitchChar, 10) / 12)) + (parseInt(diameterChars, 10) / 12) * (1 / (parseInt(pitchChar, 10) / 12)) * Math.PI) * 1 / 3 * 1.05;

                                //Round Up to next full number
                                fabricquantity = Math.ceil(fabricquantity)

                                //Add Duct Fabric Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: fabricquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });
                                

                                //Adding Logic to get next component duct wire

                                var ductwire = '';

                                if (parseInt(diameterChars, 10) < 17.9) {
                                    ductwire += 'HC0900-001';

                                }else {
                                    ductwire += 'HC1480-001'
                                    }
                                
                                // Find the internal ID of the item to be added to the BOM revision
                                var wireItemId = getItemId(ductwire);
                                if (!wireItemId) {
                                    throw new Error('Fabric Wire Item ' + ductwire + ' not found.');
                                }

                                // Add Duct Fabric Wire component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: wireItemId
                                });

                                //Fabric Wire Quantity Calculation
                                var fabricWirequantity = ((parseInt(diameterChars, 10) / 12) * parseInt(lengthChars, 10) * Math.PI * (1 / (parseInt(pitchChar, 10) / 12))) * 1.05 / 3;

                                //Round Up to next full number
                                fabricWirequantity = Math.ceil(fabricWirequantity)

                                //Add Duct Fabric Wire Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: fabricWirequantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });


                                //Adding Logic to get next component duct wire

                                var wireCap = '';

                                if (ductwire === 'HC1480-001') {
                                    wireCap += 'WIRE CAP - LARGE';

                                }else {
                                    wireCap += 'WIRE CAP - SMALL'
                                    }
                                
                                // Find the internal ID of the item to be added to the BOM revision
                                var wireCapItemId = getItemId(wireCap);
                                if (!wireCapItemId) {
                                    throw new Error('Wire Cap Item ' + wireCap + ' not found.');
                                }

                                // Add Wire Cap component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: wireCapItemId
                                });

                                //Wire Cap Quantity Calculation
                                var wireCapquantity = 2

                                //Round Up to next full number
                                wireCapquantity = Math.ceil(wireCapquantity)

                                //Add Wire Cap Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: wireCapquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component WEAR STRIP

                                var wearstrip = '';

                                if (wearstripChar === 'B') {
                                    wearstrip += 'Keder Black';
                                }

                                if (wearstripChar === 'C') {
                                    wearstrip += 'Keder Blue';
                                }

                                if (wearstripChar === 'G') {
                                    wearstrip += 'Keder Green';
                                }

                                if (wearstripChar === 'O') {
                                    wearstrip += 'Keder Orange';
                                }

                                if (wearstripChar === 'R') {
                                    wearstrip += 'Keder RED';
                                }

                                if (wearstripChar === 'W') {
                                    wearstrip += 'Keder White';
                                }

                                if (wearstripChar === 'Y') {
                                    wearstrip += 'Keder Yellow';
                                }

                                if (wearstripChar === 'N') {
                                    wearstrip += 'NO WEAR STRIP';
                                }

                                
                                // Find the internal ID of the item to be added to the BOM revision
                                var wearstripItemId = getItemId(wearstrip);
                                if (!wearstripItemId) {
                                    throw new Error('Wear Strip Item ' + wearstrip + ' not found.');
                                }

                                // Add Wear Strip component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: wearstripItemId
                                });

                                //Wear Strip Quantity Calculation

                                var wearstripquantity = ''

                                if (wearstripChar === 'N') {
                                    wearstripquantity = 0;
                                } else {
                                    wearstripquantity = fabricWirequantity
                                }

                                //Add Wear Strip Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: wearstripquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component LABOR

                                var labor = 'Labor - RCD';
                                
                                // Find the internal ID of the item to be added to the BOM revision
                                var laborItemId = getItemId(labor);
                                if (!laborItemId) {
                                    throw new Error('Labor Item ' + labor + ' not found.');
                                }

                                // Add Labor component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: laborItemId
                                });

                                //Labor Quantity Calculation


                                //Determine Production line
                                if (ductTypeChar === 'S') {
                                    productionline = 'Sewn - Double Needle';
                                }   else if (parseInt(diameterChars, 10) === 6) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 8) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 12) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 14) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 16) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 18) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 20) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 24) {
                                        productionline = 'FX100';
                                    }

                                    else if (parseInt(diameterChars, 10) === 27) {
                                        productionline = 'FX100';
                                    } else {
                                        productionline = 'Sewn - Double Needle'
                                    }

                                // Determine Line Speed
                                if (productionline === 'FX100') {
                                    if (fabricWeightChars === '10') {
                                        linespeed = 33
                                    }
                                    if (fabricWeightChars === '12') {
                                        linespeed = 31
                                    }
                                    if (fabricWeightChars === '13') {
                                        linespeed = 30
                                    }
                                    if (fabricWeightChars === '14') {
                                        linespeed = 30
                                    }
                                    if (fabricWeightChars === '16') {
                                        linespeed = 29
                                    }
                                    if (fabricWeightChars === '18') {
                                        linespeed = 26
                                    }
                                } else {
                                    if (fabricWeightChars === '10') {
                                        linespeed = 16
                                    }
                                    if (fabricWeightChars === '12') {
                                        linespeed = 15
                                    }
                                    if (fabricWeightChars === '13') {
                                        linespeed = 14
                                    }
                                    if (fabricWeightChars === '14') {
                                        linespeed = 13
                                    }
                                    if (fabricWeightChars === '16') {
                                        linespeed = 12
                                    }
                                    if (fabricWeightChars === '18') {
                                        linespeed = 11
                                    }
                                }

                                //get the minutes per duct
                                var minutesperduct = (fabricquantity * 3) / linespeed + 2

                                //Roundup to 4 decimal places
                                minutesperduct = minutesperduct * 1000;

                                minutesperduct = Math.ceil(minutesperduct)

                                minutesperduct = minutesperduct / 1000;

                                var laborquantity = minutesperduct / 60 * (480 / 400);

                                //Round Up to hundreths place
                                laborquantity = laborquantity * 100;

                                laborquantity = Math.ceil(laborquantity)

                                laborquantity = laborquantity / 100;

                                //Add Labor Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: laborquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component OVERHEAD

                                var overhead = 'Overhead - RCD';
                                
                                // Find the internal ID of the item to be added to the BOM revision
                                var overheadItemId = getItemId(overhead);
                                if (!overheadItemId) {
                                    throw new Error('Overhead Item ' + overhead + ' not found.');
                                }

                                // Add Duct Fabric Wire component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: overheadItemId
                                });

                                //Overhead Quantity Calculation
                                var overheadquantity = laborquantity

                                //Add Overhead Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: overheadquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });


                                //Adding Logic to get next component MACHINE HOURS

                                var machine = ''

                                if (productionline === 'Sewn - Double Needle') {
                                    machine = 'Machine Hours - Sewn - Double Needle'
                                }  
                                if (productionline === 'FX100') {
                                    machine = 'Machine Hours - FX100'
                                }

                                // Find the internal ID of the item to be added to the BOM revision
                                var machineItemId = getItemId(machine);
                                if (!machineItemId) {
                                    throw new Error('Machine Item ' + machine + ' not found.');
                                }

                                // Add Machine component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: machineItemId
                                });

                                //Machine Quantity Calculation
                                var machinequantity = laborquantity

                                //Add Machine Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: machinequantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component CUFF FABRIC

                                var cufffabric = ''

                                if (ductTypeChar === 'T' || ductTypeChar === 'B' || ductTypeChar === 'A') {
                                    cufffabric += 'KS-';
                                }

                                if (ductTypeChar === 'I') {
                                    cufffabric += 'INSMAT-';
                                }

                                if (ductTypeChar === 'S') {
                                    cufffabric += 'SCN-';
                                }

                                if (ductTypeChar === 'U') {
                                    cufffabric += 'UL-';
                                }
                                
                                if (ductTypeChar === 'P') {
                                    cufffabric += 'PWF-';
                                }

                                //Logic for fabric weight
                                if (fabricWeightChars === '10') {
                                    cufffabric += '1000';
                                }

                                if (fabricWeightChars === '13') {
                                    cufffabric += '1300';
                                }

                                if (fabricWeightChars === '14') {
                                    cufffabric += '1400';
                                }
                                
                                if (fabricWeightChars === '16') {
                                    cufffabric += '1600';
                                }

                                if (fabricWeightChars === '18') {
                                    cufffabric += '1800';
                                }

                                var colorSuffixMap = {
                                    'B': '-BLK',
                                    'C': '-RBL',
                                    'G': '-GRN',
                                    'O': '-ORA',
                                    'R': '-RED',
                                    'W': '-WHT',
                                    'Y': '-YEL'
                                };
                                cufffabric += colorSuffixMap[fabricColorChars] || '';
                                
                                var sizeSuffixMapcuff = {
                                    '3': '-812',
                                    '4': '-812',
                                    '6': '-812',
                                    '7': '-812'
                                };
                                cufffabric += sizeSuffixMapcuff[pitchChar] || '';

                                var blockoutending = {
                                    'B': '-BO',
                                };
                                cufffabric += blockoutending[ductTypeChar] || '';


                                // Find the internal ID of the item to be added to the BOM revision
                                var cufffabricItemId = getItemId(cufffabric);
                                if (!cufffabricItemId) {
                                    throw new Error('Cuff Fabric Item ' + cufffabric + ' not found.');
                                }

                                // Add Cuff Fabric component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: cufffabricItemId
                                });

                                //Cuff Fabric Quantity Calculation


                                //Determine how many ends that are not soft cuff
                                var cuffone = ''
                                var cufftwo = ''

                                if (cuffOneChars != 'SC') {
                                    cuffone = 1;
                                } else {
                                    cuffone = 0;
                                }

                                if (cuffTwoChars != 'SC') {
                                    cufftwo = 1;
                                } else {
                                    cufftwo = 0;
                                }

                                var cuffs = cuffone + cufftwo

                                var cufffabricquantity = parseInt(diameterChars, 10) / 12 * Math.PI / 3

                                //Round up to nearest 0.25
                                cufffabricquantity = Math.ceil(cufffabricquantity / 0.25) * 0.25

                                //Add the amount of ends that are not soft cuff
                                cufffabricquantity = cufffabricquantity * cuffs

                                //Add Cuff Farbic Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: cufffabricquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component Cuff One

                                var cuffoneitem = ''

                                if (cuffOneChars === 'WG') {
                                    cuffoneitem = cuffoneitem + 'WORMGEAR - ';
                                }

                                if (cuffOneChars === 'HC') {
                                    cuffoneitem = cuffoneitem + 'SUB-HOOP-';
                                }

                                if (cuffOneChars === 'BC') {
                                    cuffoneitem = cuffoneitem + 'SUB - Belt Cuff - ';
                                }

                                if (cuffOneChars === 'PL') {
                                    cuffoneitem = cuffoneitem + 'PINLOCK-';
                                }
                            
                                if (cuffOneChars === 'SC') {
                                    cuffoneitem = cuffoneitem + 'Soft Cuff';
                                }

                                if (cuffOneChars === 'HC') {
                                    cuffoneitem = cuffoneitem + diameterChars;
                                }

                                if (cuffOneChars === 'BC') {
                                    cuffoneitem = cuffoneitem + diameterChars;
                                }

                                if (cuffOneChars === 'PL') {
                                    cuffoneitem = cuffoneitem + diameterChars;
                                }

                                if (cuffOneChars === 'WG') {
                                    cuffoneitem = cuffoneitem + diameterChars;
                                }

                                // Find the internal ID of the item to be added to the BOM revision
                                var cuffoneItemId = getItemId(cuffoneitem);
                                if (!cuffoneItemId) {
                                    throw new Error('First Cuff Item ' + cuffoneitem + ' not found. We used these characters ' + cuffOneChars );
                                }

                                // Add Cuff One component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: cuffoneItemId
                                });

                                //Cuff One Quantity Calculation
                                var cuffonequantity = ''

                                if (cuffoneitem === 'Soft Cuff') {
                                    cuffonequantity = 0;
                                } else {
                                    cuffonequantity = 1;
                                }

                                //Add Cuff One Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: cuffonequantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component Cuff Two

                                var cufftwoitem = ''

                                if (cuffTwoChars === 'WG') {
                                    cufftwoitem += 'WORMGEAR - '
                                }

                                if (cuffTwoChars === 'HC') {
                                    cufftwoitem += 'SUB-HOOP-'
                                }

                                if (cuffTwoChars === 'BC') {
                                    cufftwoitem += 'SUB - Belt Cuff - '
                                }

                                if (cuffTwoChars === 'SC') {
                                    cufftwoitem += 'Soft Cuff'
                                }

                                if (cuffTwoChars === 'PL') {
                                    cufftwoitem += 'PINLOCK-'
                                }

                                if (cuffTwoChars === 'HC') {
                                    cufftwoitem = cufftwoitem + diameterChars;
                                }

                                if (cuffTwoChars === 'BC') {
                                    cufftwoitem = cufftwoitem + diameterChars;
                                }

                                if (cuffTwoChars === 'PL') {
                                    cufftwoitem = cufftwoitem + diameterChars;
                                }

                                if (cuffTwoChars === 'WG') {
                                    cufftwoitem = cufftwoitem + diameterChars;
                                }

                                // Find the internal ID of the item to be added to the BOM revision
                                var cufftwoitemId = getItemId(cufftwoitem);
                                if (!cufftwoitemId) {
                                    throw new Error('Second Cuff Item ' + cufftwoitem + ' not found. We used these characters ' + cuffTwoChars);
                                }

                                // Add Cuff Two component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: cufftwoitemId
                                });

                                //Cuff Two Quantity Calculation
                                var cufftwoquantity = ''

                                if (cufftwoitem === 'Soft Cuff') {
                                    cufftwoquantity = 0
                                } else {
                                    cufftwoquantity = 1
                                }

                                //Add Cuff Two Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: cufftwoquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component FINISH LABOR

                                var finishlabor = labor

                                // Find the internal ID of the item to be added to the BOM revision
                                var finishlaboritemId = getItemId(finishlabor);
                                if (!finishlaboritemId) {
                                    throw new Error('Finish Labor Item ' + finishlabor + ' not found.');
                                }

                                // Add Finish Labor component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: finishlaboritemId
                                });

                                //Finish Labor Quantity Calculation
                                var finishlaborquantity = 0.06 * cuffs

                                //Add Finish Labor Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: finishlaborquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component FINISH OVERHEAD

                                var finishoverhead = overhead

                                // Find the internal ID of the item to be added to the BOM revision
                                var finishoverheaditemId = getItemId(finishoverhead);
                                if (!finishoverheaditemId) {
                                    throw new Error('Finish Overhead Item ' + finishoverhead + ' not found.');
                                }

                                // Add Finish Overhead component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: finishoverheaditemId
                                });

                                //Finish Overhead Quantity Calculation
                                var finishoverheadquantity = finishlaborquantity

                                //Add Finish Overhead Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: finishoverheadquantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                //Adding Logic to get next component FINISH MACHINE

                                var finishmachine = 'Machine Hours - Sewn - Single Needle'

                                // Find the internal ID of the item to be added to the BOM revision
                                var finishmachineitemId = getItemId(finishmachine);
                                if (!finishmachineitemId) {
                                    throw new Error('Finish Machine Item ' + finishmachine + ' not found.');
                                }

                                // Add Finish Machine component to BOM revision
                                bomRevision.selectNewLine({ sublistId: 'component' });
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'item',
                                    value: finishmachineitemId
                                });

                                //Finish Machine Quantity Calculation
                                var finishmachinequantity = finishlaborquantity

                                //Add Finish Machine Quantity Component to the BOM Revision
                                bomRevision.setCurrentSublistValue({
                                    sublistId: 'component',
                                    fieldId: 'bomquantity',
                                    value: finishmachinequantity
                                });
                                bomRevision.commitLine({ sublistId: 'component' });

                                // Save BOM revision with the added component
                                var fabricComponent = bomRevision.save();
                                

                                // Add logs to check and make sure each component was added correctly
                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + fabric + ' with the quantity of ' + fabricquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + ductwire + ' with the quantity of ' + fabricWirequantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + wireCap + ' with the quantity of ' + wireCapquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + wearstrip + ' with the quantity of ' + wearstripquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + labor + ' with the quantity of ' + laborquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + overhead + ' with the quantity of ' + overheadquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + machine + ' with the quantity of ' + machinequantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + cufffabric + ' with the quantity of ' + cufffabricquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + cuffoneitem + ' with the quantity of ' + cuffonequantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + cufftwoitem + ' with the quantity of ' + cufftwoquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + finishlabor + ' with the quantity of ' + finishlaborquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + finishoverhead + ' with the quantity of ' + finishoverheadquantity + ' added to BOM Revision ID: ' + fabricComponent
                                });

                                log.debug({
                                    title: 'Component Added to BOM Revision',
                                    details: 'Component ' + finishmachine + ' with the quantity of ' + finishmachinequantity + ' added to BOM Revision ID: ' + fabricComponent
                                });


                            } catch (e) {
                                log.error({
                                    title: 'Error Creating BOM or BOM Revision',
                                    details: e.message
                                });
                            }
                            
                            log.debug({
                                title: 'Item Updated',
                                details: 'Description: ' + description + ', Width: ' + width + ', Length: ' + length + ', Duct Pitch: ' + ductPitch
                            });

                            // POTENTIAL ADDITION - This section may be used to populate the MSRP field of a new item being built based on SKU
                            // // Load MSRP pricing in the assembly item
                            // var msrp = record.load({
                            //     type: record.Type.ASSEMBLY_ITEM,
                            //     id: internalId,
                            // });

                            // var msrpvalue = 1;

                            // //Set the MSRP Value as the Attachment value
                            // msrp.setSublistValue({
                            //     sublistId: 'price1',
                            //     fieldId: 'price_1_',
                            //     line: 0,
                            //     value: msrpvalue
                            // });

                            // //Save the MSRP attachement to the Assembly Build
                            // msrp.save()

                        } else {
                            log.debug({
                                title: 'Skipped Processing',
                                details: 'Record is not associated with the target subsidiary ID. Skipping processing.'
                            });
                        }
                        
                    } else {
                        log.error({
                            title: 'Invalid ITEM NAME/NUMBER',
                            details: 'ITEM NAME/NUMBER must be exactly 16 characters long.'
                        });
                    }
                }
            }
            } catch (e) {
                log.error({
                    title: 'Error Processing Item',
                    details: e.message
                });
            }
        }
    }

    // Helper function to find item ID by name
    function getItemId(itemName) {
        var itemId = null;

        var itemSearch = search.create({
            type: search.Type.ITEM,
            filters: [
                ['name', search.Operator.IS, itemName]
            ],
            columns: ['internalid']
        });

        itemSearch.run().each(function(result) {
            itemId = result.getValue('internalid');
            return false; // Stop after the first result
        });

        return itemId;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});