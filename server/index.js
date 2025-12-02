const cp = require('./service/individualServices/CyclicProcessService/cyclicProcess');
const logger = require('./service/LoggingService.js').getLogger();

'use strict';

var path = require('path');
var http = require('http');

//var oas3Tools = require('openbackhaul-oas3-tools');
var oas3Tools = require('oas3-tools');
var serverPort = 8080;
const prepareElasticsearch = require('./service/individualServices/ElasticsearchPreparation');
var appCommons = require('onf-core-model-ap/applicationPattern/commons/AppCommons');
const { env } = require('process');

// uncomment if you do not want to validate security e.g. operation-key, basic auth, etc
//appCommons.openApiValidatorOptions.validateSecurity = false;
if (process.env.DEBUG && process.env.DEBUG.toLowerCase() === "true") {
    logger.warn("Working in debug mode");
    logger.warn("Checking validation")
    appCommons.openApiValidatorOptions.validateSecurity = false;
    // appCommons.openApiValidatorOptions.validateResponses = false;
    // appCommons.openApiValidatorOptions.validateRequests = false;
    logger.warn("Validate Security: " + appCommons.openApiValidatorOptions.validateSecurity);
    logger.warn("Validate Responses: " + appCommons.openApiValidatorOptions.validateResponses);
    logger.warn("Validate Requests: " + appCommons.openApiValidatorOptions.validateRequests);
}

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    openApiValidator: appCommons.openApiValidatorOptions
    };

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();
appCommons.setupExpressApp(app);

global.databasePath = './database/load.json'
if (process.env.LOCAL && process.env.LOCAL.toLowerCase() === "true") {
    logger.warn("Working in debug mode");
    global.databasePath = './server/database/load.json';
    logger.warn("Load data from: " + global.databasePath);
}

prepareElasticsearch().catch(err => {
    logger.error(`Error preparing Elasticsearch : ${err}`);
}).finally(
    () => {
        // Initialize the Swagger middleware
        http.createServer(app).listen(serverPort, function () {
        logger.info('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
        logger.info('Swagger-ui is available on http://localhost:%d/docs', serverPort);
        });
        appCommons.performApplicationRegistration();

        //cp.embeddingCausesCyclicRequestsForUpdatingMacTableFromDeviceAtMatr();
    }
);
