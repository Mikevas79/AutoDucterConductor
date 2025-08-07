/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 *
 * Demonstration SuiteScript 2.x
 * - Sets defaults on record load
 * - Adds helper fields and messages
 * - Validates naming conventions
 * - Executes post-save stubs
 */
define([
    'N/record',
    'N/search',
    'N/log',
    'N/ui/serverWidget',
    'N/ui/message',
    'N/error'
], function(record, search, log, serverWidget, message, error) {

    /**
     * beforeLoad: initialize form
     */
    function beforeLoad(context) {
        var eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.COPY) {
            var rec = context.newRecord;
            var form = context.form;

            // 1. Default tax schedule
            rec.setValue({ fieldId: 'taxschedule', value: 4 });

            // 2. Add Auto-Build checkbox
            var autoBuild = form.addField({
                id: 'custpage_auto_build',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Enable Auto-Build?'
            });
            autoBuild.defaultValue = 'T';

            // 3. Group helper fields
            form.addFieldGroup({
                id: 'custpage_helper_grp',
                label: 'Helper Settings'
            });
            form.getField({ id: 'custpage_auto_build' }).updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE,
                group: 'custpage_helper_grp'
            });

            // 4. Informational message
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                title: 'Defaults Applied',
                message: 'Record defaults set and Auto-Build option added.',
                duration: 5000
            });
        }
    }

    /**
     * beforeSubmit: validate business rules
     */
    function beforeSubmit(context) {
        var eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.EDIT) {
            var rec = context.newRecord;
            var build = rec.getValue({ fieldId: 'custpage_auto_build' });

            if (build) {
                var sku = rec.getValue({ fieldId: 'itemid' }) || '';
                // Require format: 3 uppercase + dash + 4 digits
                var skuReg = /^[A-Z]{3}-\d{4}$/;
                if (!skuReg.test(sku)) {
                    throw error.create({
                        name: 'INVALID_SKU_FORMAT',
                        message: 'SKU must match pattern ABC-1234.',
                        notifyOff: false
                    });
                }
            }
        }
    }

    /**
     * afterSubmit: post-save logic
     */
    function afterSubmit(context) {
        var eventType = context.type;
        if (eventType === context.UserEventType.CREATE || eventType === context.UserEventType.EDIT) {
            var recId = context.newRecord.id;
            log.debug('Record Saved', 'ID: ' + recId);

            // Example: flag record as processed
            try {
                record.submitFields({
                    type: context.newRecord.type,
                    id: recId,
                    values: { custitem_processed: true }
                });
                log.audit('Post Save', 'Processed flag set');
            } catch (e) {
                log.error('Post Save Error', e.message);
            }
        }
    }

    /**
     * Helper: search for item internal ID by name
     * @param {string} name
     * @return {number|null}
     */
    function getItemId(name) {
        var foundId = null;
        search.create({
            type: search.Type.INVENTORY_ITEM,
            filters: [['name', search.Operator.IS, name]],
            columns: ['internalid']
        }).run().each(function(res) {
            foundId = res.getValue('internalid');
            return false;
        });
        return foundId;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
});
