# generator-di-operator

Yeoman generator for downloading SAP Data Intelligence python operators for developing and testing standalone.

## Prompts

1. SAP Data Intelligence URL (stored)
2. Tenant (stored, default = 'default')
3. User (stored): Sap Data Intelligence user of Workspace
4. Password (stored): Sap Data Intelligence user password of Workspace
5. Operator (stored): Operator name (=folder name in vflow)

## Generation 

* The generator downloads all files from the operator directory
* If the python-script referenced in the "operator.json" exists and is not empty the python script is adjusted
    * Adding or Uncomment the mock-di-api
    * Commenting the 'api.generator' or 'api.callback'
    * Adding if not existing already the 'main'-function
* Else a new python-script is created based on the information of the 'configSchema.json' and 'operator.json'
* The downloaded files are stored to the <project>/operators folder
* The 'mock_di_api.py'-file is stored to the <project>/utils folder
* A <project>/'testdata' folder is created for storing the test data

## Open Tasks

* Generating new operator standalone without previously creating one in SAP Data Intelligence modeler
* Adding git repository
* Utility functions for creating test data like reading csv-file from testdata and providing it as a message.table 

