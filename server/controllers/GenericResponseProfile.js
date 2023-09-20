'use strict';

var utils = require('../utils/writer.js');
var GenericResponseProfile = require('../service/GenericResponseProfileService');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getGenericResponseProfileDatatype = function getGenericResponseProfileDatatype (req, res, next, uuid) {
  GenericResponseProfile.getGenericResponseProfileDatatype(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getGenericResponseProfileDescription = function getGenericResponseProfileDescription (req, res, next, uuid) {
  GenericResponseProfile.getGenericResponseProfileDescription(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getGenericResponseProfileFieldName = function getGenericResponseProfileFieldName (req, res, next, uuid) {
  GenericResponseProfile.getGenericResponseProfileFieldName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getGenericResponseProfileOperationName = function getGenericResponseProfileOperationName (req, res, next, uuid) {
  GenericResponseProfile.getGenericResponseProfileOperationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getGenericResponseProfileValue = function getGenericResponseProfileValue (req, res, next, uuid) {
  GenericResponseProfile.getGenericResponseProfileValue(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putGenericResponseProfileValue = function putGenericResponseProfileValue (req, res, next, body, uuid) {
  GenericResponseProfile.putGenericResponseProfileValue(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
