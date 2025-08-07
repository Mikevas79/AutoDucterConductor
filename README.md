Demo: NetSuite SuiteScript 2.x User Event Script (My Original Script was over 1500 lines but reduced to 100 lines to protect original company information)

A lightweight demonstration of key SuiteScript 2.x patterns, suitable for showcasing on GitHub.

Overview

This repository contains a simplified UserEventScript for NetSuite SuiteScript 2.x. It illustrates best practices for:

Defaulting Fields: Setting default values in beforeLoad

Form Customization: Adding custom fields, field groups, and user messages

Validation: Enforcing naming conventions in beforeSubmit

Post-Save Logic: Performing actions in afterSubmit (e.g., flagging a record)

Search Helpers: A reusable function to find an item’s internal ID by name

Note: This demo uses placeholder IDs and patterns. It’s stripped of any proprietary business logic and can be adapted to your own NetSuite instance.

Key Features

Defaults & UI Hooks (beforeLoad)

Sets a default Tax Schedule (taxschedule = 4).

Injects a grouped Auto-Build checkbox (custpage_auto_build).

Displays a brief informational banner on form load.

Business Validation (beforeSubmit)

Validates the SKU (itemid) against a regex pattern: ABC-1234.

Throws a NetSuite error if the format is incorrect, preventing bad data.

Post-Save Stubs (afterSubmit)

Logs record creation/edits.

Sets a custom “processed” flag (custitem_processed) via record.submitFields.

Captures success and errors via log.audit and log.error.

Helper Function

getItemId(name): Searches inventoryitem records by name and returns the first internal ID.

Installation & Deployment

Clone this repo

git clone https://github.com/your-username/netsuite-suitescript-demo.git

Upload to NetSuite

Navigate to Customization > Scripting > Scripts in your NetSuite account.

Click New and choose SuiteScript 2.x.

Upload netsuite-demo-userevent.js from this repo.

Deploy

Create a Script Deployment for record types such as Inventory Item or Assembly Item.

Set Event Types to Before Load, Before Submit, After Submit.

Save and test by creating or editing an item record.

Customization

Field IDs & Defaults

Update taxschedule ID or value as needed.

Change or add form fields in beforeLoad under the custpage_helper_grp group.

Validation Patterns

Modify the regex in beforeSubmit to fit your SKU or naming conventions.

Post-Save Logic

Extend afterSubmit to integrate with external services, send email notifications, or update related records.

Helper Searches

Adapt getItemId to search other record types (e.g., record.Type.CUSTOMER).


