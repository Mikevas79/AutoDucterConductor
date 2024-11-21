NetSuite SuiteScript 2.x - Automated Item Creation & BOM Generation
Hello and welcome!

This repository contains a SuiteScript 2.x custom script designed to streamline the creation of new items in NetSuite. The script automatically generates items based on a specified Item Name and Number and populates essential fields with the correct information, saving time and reducing errors.

Key Features:
Automated Item Creation: When a user enters a specific Item Name/Number in a Lot Numbered Assembly, the script automatically creates the item, filling out about 30 fields with the required details.

Bill of Materials (BOM) Generation: The script calculates and creates the BOM for the item, ensuring the correct materials and quantities are included for manufacturing. This ensures the manufacturing team can start production as soon as the sales team enters the item.

Error Prevention: The script includes a safeguard to prevent errors caused by incorrect Item Names/Numbers. If the naming convention is not followed, the script triggers a NetSuite error screen to stop the process, helping to avoid creating items that don't exist.

How to Use:
Upload the script to your NetSuite account.
In Script Deployment, select Lot Numbered Assembly or Bill of Materials as the deployment type.
Once deployed, the script will automatically run whenever an item is entered in a Lot Numbered Assembly.
Important Notes:
The script is currently configured for a subsidiary with the internal ID of 2. If your company uses a different subsidiary ID, modify or remove the check on line 155.
The Item Name/Number must be exactly 16 characters long for the script to function properly.
Feel free to modify the logic to better fit your company's needs (e.g., different custom fields or parts).

Thanks for checking out my script!
