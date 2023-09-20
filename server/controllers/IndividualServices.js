'use strict';

var utils = require('../utils/writer.js');
var IndividualServices = require('../service/IndividualServicesService');
var ExecutionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');


module.exports.bequeathYourDataAndDie = function bequeathYourDataAndDie (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.bequeathYourDataAndDie(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.provideListOfNetworkElementInterfacesOnPath = function provideListOfNetworkElementInterfacesOnPath (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.provideListOfNetworkElementInterfacesOnPath(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation = function provideListOfNetworkElementInterfacesOnPathInGenericRepresentation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.provideMacTableOfAllDevices = function provideMacTableOfAllDevices (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.provideMacTableOfAllDevices(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.provideMacTableOfSpecificDevice = function provideMacTableOfSpecificDevice (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.provideMacTableOfSpecificDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.readCurrentMacTableFromDevice = function readCurrentMacTableFromDevice (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  IndividualServices.readCurrentMacTableFromDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};
