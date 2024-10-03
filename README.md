Hello, 

This is my NetSuite Suitescript 2.x version of a custom script I made to automatically make new Items based on the entered Item Name and Number. 

When a user types in a Specific Item Name/Number in a Lot Numbered Assembly. It will automatically make this item by filling out around 30 boxes with the correct item information.
The script also does the math invoved to create a Bill of Materials with the correct amounts and materials needed for each item so that way the Manufaturing team can make the item immidatly as soon as the Sales person puts the item name/number in. 

There is also functionality for if you do not follow the naming convention, you will get a NetSuite Error Screen. This helps prevent potential errror's when somone tries to make somthing, the company does not have based on their inputted Item Name/Number.

To use this in netsuite, upload this to your scripts, under script deployment, select Lot Numbered Assembly/Bill of Materials. This will now run for your Lot Numbered Assembly items.

Note: Currently this is set to only work for a subsidary with the internal ID of 2. Change or remove this on line 155 if you have a different subidary internal ID. You must also have an Item Name/Number that is excatly 16 characters.

Thanks for checking out my script!
