'use strict';

var utils = require('../utils/writer.js');
var IndividualServices = require('../service/IndividualServicesService');
var executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var ResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
var ResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const RequestBuilder = require('onf-core-model-ap/applicationPattern/rest/client/RequestBuilder');


module.exports.bequeathYourDataAndDie = async function bequeathYourDataAndDie(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  await IndividualServices.bequeathYourDataAndDie(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.provideListOfNetworkElementInterfacesOnPath = async function provideListOfNetworkElementInterfacesOnPath(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await IndividualServices.provideListOfNetworkElementInterfacesOnPath(body, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);

};

module.exports.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation = async function provideListOfNetworkElementInterfacesOnPathInGenericRepresentation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await IndividualServices.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation(body, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.provideMacTableOfAllDevices = async function provideMacTableOfAllDevices(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await IndividualServices.provideMacTableOfAllDevices(user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};


module.exports.provideMacTableOfSpecificDevice = async function provideMacTableOfSpecificDevice(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  await IndividualServices.provideMacTableOfSpecificDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });
  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.readCurrentMacTableFromDevice = async function readCurrentMacTableFromDevice(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};

  await IndividualServices.readCurrentMacTableFromDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney, req.url)
    .then(async function (responseBody) {
      responseBodyToDocument = responseBody;
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      ResponseBuilder.buildResponse(res, responseCode, responseBody, responseHeader);
    })
    .catch(async function (responseBody) {
      let responseHeader = await ResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
      let sentResp = ResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
      responseCode = sentResp.code;
      responseBodyToDocument = sentResp.body;
    });

  executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.testMacAddressData = async function testMacAddressData(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    // Esempio: recupera i dati dal corpo della richiesta
    const requestData = req.body;

    // Esempio di operazioni necessarie con i dati ricevuti

    // Esempio di risposta di successo
    const responseBody = {
      "code": 200, 
      "request-id": "11111",
      data: requestData, // Puoi includere i dati elaborati nella risposta, se necessario
      message: 'Richiesta elaborata con successo'
    };

    console.log('testMacAddressData RECEIVED DATA:', JSON.stringify(requestData));

    res.status(200).json(responseBody);
  } catch (error) {
    console.error('Errore durante l\'elaborazione della richiesta:', error);
    res.status(500).json({
      code: 500,
      message: 'Errore interno del server',
      errors: [
        {
          path: '.response.code',
          message: 'should have required property \'code\'',
          errorCode: 'required.openapi.validation'
        }
      ]
    });
  }
};



