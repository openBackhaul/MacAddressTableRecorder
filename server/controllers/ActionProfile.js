'use strict';

var utils = require('../utils/writer.js');
var ActionProfile = require('../service/ActionProfileService');
var responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getActionProfileConsequentOperationReference = function getActionProfileConsequentOperationReference (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.getActionProfileConsequentOperationReference(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileDisplayInNewBrowserWindow = function getActionProfileDisplayInNewBrowserWindow (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.getActionProfileDisplayInNewBrowserWindow(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileInputValueListt = function getActionProfileInputValueListt (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.getActionProfileInputValueListt(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileLabel = function getActionProfileLabel (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.getActionProfileLabel(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getActionProfileOperationName = function getActionProfileOperationName (req, res, next, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.getActionProfileOperationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putActionProfileConsequentOperationReference = function putActionProfileConsequentOperationReference (req, res, next, body, uuid) {
  let responseCode = responseCodeEnum.code.OK;
  ActionProfile.putActionProfileConsequentOperationReference(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
