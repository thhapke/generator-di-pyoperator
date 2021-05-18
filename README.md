# generator-di-operator

Yeoman generator for downloading SAP Data Intelligence python operators for developing and testing standalone and uploading it again. 

## Prompts

1. Download from DI or Upload to DI
2. SAP Data Intelligence URL (stored)
3. Tenant (stored, default = 'default')
4. User (stored): Sap Data Intelligence user of Workspace
5. Password (stored): Sap Data Intelligence user password of Workspace
6. Operator (stored): Operator name (=folder name in vflow)

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

## Configuration Saving

For sending back the data to the SAP Data Intelligence system the latest configuration is stored in .yo-rc.json.

## Installation 

### YEOMAN
Yeoman is a scaffolding tool creating the framework and templates that you need for a quick start.

1. Installing ```npm```, a JavaScript software registry and package installation tool 
    * MacOs: ```brew install node``` 
2. Installing yeoman
    * ```npm install -g yo````
3. Installing the di-pyoperator generator
    * ```npm install -g generator-di-pyoperator```

### Local SAP Data Intelligence Operator deployment

0. Create Git - Repository <project>
1. Clone repository locally or make project directory <project>
2. ```cd project````
3. Run yo-generator for preparing local DI operator development 
```yo di-pyoperator```


## Open Tasks

* Generating new operator standalone without previously creating one in SAP Data Intelligence modeler
* Adding git repository
* Utility functions for creating test data like reading csv-file from testdata and providing it as a message.table 

