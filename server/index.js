'use strict';

var path = require('path');
var http = require('http');

var oas3Tools = require('openbackhaul-oas3-tools');
var serverPort = 8080;

var appCommons = require('onf-core-model-ap/applicationPattern/commons/AppCommons');

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
    //openApiValidator: appCommons.openApiValidatorOptions
    };

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();


global.databasePath ='./database/load.json'

appCommons.setupExpressApp(app);

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});