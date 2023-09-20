'use strict';

var utils = require('../utils/writer.js');
var BasicServices = require('../service/BasicServicesService');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var ExecutionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');


module.exports.embedYourself = function embedYourself (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.embedYourself(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.endSubscription = function endSubscription (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.endSubscription(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.informAboutApplication = function informAboutApplication (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.informAboutApplication(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.informAboutApplicationInGenericRepresentation = function informAboutApplicationInGenericRepresentation (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.informAboutApplicationInGenericRepresentation(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.informAboutReleaseHistory = function informAboutReleaseHistory (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.informAboutReleaseHistory(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.informAboutReleaseHistoryInGenericRepresentation = function informAboutReleaseHistoryInGenericRepresentation (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.informAboutReleaseHistoryInGenericRepresentation(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBody);
};

module.exports.inquireOamRequestApprovals = function inquireOamRequestApprovals (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.inquireOamRequestApprovals(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.listLtpsAndFcs = function listLtpsAndFcs (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.listLtpsAndFcs(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectOamRequestInformation = function redirectOamRequestInformation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.redirectOamRequestInformation(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectServiceRequestInformation = function redirectServiceRequestInformation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.redirectServiceRequestInformation(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.redirectTopologyChangeInformation = function redirectTopologyChangeInformation (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.redirectTopologyChangeInformation(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.registerYourself = function registerYourself (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.registerYourself(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.startApplicationInGenericRepresentation = function startApplicationInGenericRepresentation (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.startApplicationInGenericRepresentation(user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateClient = function updateClient (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.updateClient(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateOperationClient = function updateOperationClient (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.updateOperationClient(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};

module.exports.updateOperationKey = function updateOperationKey (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  BasicServices.updateOperationKey(body, user, originator, xCorrelator, traceIndicator, customerJourney)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    ExecutionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument);
};
