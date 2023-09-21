'use strict';

var utils = require('../utils/writer.js');
var IntegerProfile = require('../service/IntegerProfileService');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getIntegerProfileIntegerName = function getIntegerProfileIntegerName (req, res, next, uuid) {
  IntegerProfile.getIntegerProfileIntegerName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileIntegerValue = function getIntegerProfileIntegerValue (req, res, next, uuid) {
  IntegerProfile.getIntegerProfileIntegerValue(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMaximum = function getIntegerProfileMaximum (req, res, next, uuid) {
  IntegerProfile.getIntegerProfileMaximum(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileMinimum = function getIntegerProfileMinimum (req, res, next, uuid) {
  IntegerProfile.getIntegerProfileMinimum(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getIntegerProfileUnit = function getIntegerProfileUnit (req, res, next, uuid) {
  IntegerProfile.getIntegerProfileUnit(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putIntegerProfileIntegerValue = function putIntegerProfileIntegerValue (req, res, next, body, uuid) {
  IntegerProfile.putIntegerProfileIntegerValue(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
