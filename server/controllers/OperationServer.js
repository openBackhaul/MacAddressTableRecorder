'use strict';

var utils = require('../utils/writer.js');
var OperationServer = require('../service/OperationServerService');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getOperationServerLifeCycleState = function getOperationServerLifeCycleState (req, res, next, uuid) {
  OperationServer.getOperationServerLifeCycleState(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getOperationServerOperationKey = function getOperationServerOperationKey (req, res, next, uuid) {
  OperationServer.getOperationServerOperationKey(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getOperationServerOperationName = function getOperationServerOperationName (req, res, next, uuid) {
  OperationServer.getOperationServerOperationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putOperationServerLifeCycleState = function putOperationServerLifeCycleState (req, res, next, body, uuid) {
  OperationServer.putOperationServerLifeCycleState(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putOperationServerOperationKey = function putOperationServerOperationKey (req, res, next, body, uuid) {
  OperationServer.putOperationServerOperationKey(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
