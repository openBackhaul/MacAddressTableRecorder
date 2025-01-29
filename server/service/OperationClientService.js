'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
//const prepareForwardingAutomation = require('./individualServices/PrepareForwardingAutomation');
const ForwardingAutomationService = require('onf-core-model-ap/applicationPattern/onfModel/services/ForwardingConstructAutomationServices');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');


/**
 * Returns detailed logging configuration.
 *
 * uuid String 
 * returns inline_response_200_43
 **/
exports.getOperationClientDetailedLoggingIsOn = function(uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "operation-client-interface-1-0:detailed-logging-is-on": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject();
    }
  });
}


/**
 * Returns life cycle state of the operation
 *
 * uuid String 
 * returns inline_response_200_42
 **/
exports.getOperationClientLifeCycleState = function(uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "operation-client-interface-1-0:life-cycle-state": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject();
    }
  });
}


/**
 * Returns key used for connecting to server.
 *
 * uuid String 
 * returns inline_response_200_40
 **/
exports.getOperationClientOperationKey = function(uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "operation-client-interface-1-0:operation-key": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject();
    }
  });
}


/**
 * Returns operation name
 *
 * uuid String 
 * returns inline_response_200_39
 **/
exports.getOperationClientOperationName = function(uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "operation-client-interface-1-0:operation-name": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject();
    }
  });
}


/**
 * Returns operational state of the operation
 *
 * uuid String 
 * returns inline_response_200_41
 **/
exports.getOperationClientOperationalState = function(uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "operation-client-interface-1-0:operational-state": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject();
    }
  });
}


/**
 * Configures detailed logging on/off.
 *
 * body Operationclientinterfaceconfiguration_detailedloggingison_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putOperationClientDetailedLoggingIsOn = function(url, body, uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let isUpdated = await fileOperation.writeToDatabaseAsync(url, body, false);
      if (isUpdated) {
        /*let forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
          uuid
        );*/
        //TODO to be verify when database async
        ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
          forwardingAutomationInputList
        );
      }
      resolve();
    } catch (error) {
      reject();
    }
  });
}


/**
 * Configures key used for connecting to server.
 *
 * body Operationclientinterfaceconfiguration_operationkey_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putOperationClientOperationKey = function(body,uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let isUpdated = await operationClientInterface.setOperationKeyAsync(uuid, body["operation-client-interface-1-0:operation-key"]);
      if (isUpdated) {
        /*let forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
          uuid
        );*/
        ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
          forwardingAutomationInputList
        );
      }
      resolve();
    } catch (error) {
      reject();
    }
  });
}


/**
 * Configures operation name
 *
 * body Operationclientinterfaceconfiguration_operationname_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putOperationClientOperationName = function(body,uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let isUpdated = await operationClientInterface.setOperationNameAsync(uuid, body["operation-client-interface-1-0:operation-name"]);
      if (isUpdated) {
        /*let forwardingAutomationInputList = await prepareForwardingAutomation.OAMLayerRequest(
          uuid
        );*/
        ForwardingAutomationService.automateForwardingConstructWithoutInputAsync(
          forwardingAutomationInputList
        );
      }
      resolve();
    } catch (error) {
      reject();
    }
  });
}

