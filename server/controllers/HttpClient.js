'use strict';

var utils = require('../utils/writer.js');
var HttpClient = require('../service/HttpClientService');
var oamLogService = require('onf-core-model-ap/applicationPattern/services/OamLogService');

module.exports.getHttpClientApplicationName = function getHttpClientApplicationName (req, res, next, uuid) {
  HttpClient.getHttpClientApplicationName(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.getHttpClientReleaseNumber = function getHttpClientReleaseNumber (req, res, next, uuid) {
  HttpClient.getHttpClientReleaseNumber(uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);    
};

module.exports.putHttpClientApplicationName = function putHttpClientApplicationName (req, res, next, body, uuid) {
  HttpClient.putHttpClientApplicationName(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};

module.exports.putHttpClientReleaseNumber = function putHttpClientReleaseNumber (req, res, next, body, uuid) {
  HttpClient.putHttpClientReleaseNumber(body, uuid)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
    oamLogService.recordOamRequest(req.url, req.body, responseCode, req.headers.authorization, req.method);
};
