'use strict';

var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');


/**
 * Returns the reference on the consequent operation
 *
 * uuid String 
 * returns inline_response_200_14
 **/
exports.getActionProfileConsequentOperationReference = function (url) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
  "action-profile-1-0:consequent-operation-reference" : "/core-model-1-4:control-construct/logical-termination-point=ro-1-0-0-op-s-bs-002/layer-protocol=0/operation-server-interface-1-0:operation-server-interface-pac/operation-server-interface-capability/operation-name"
    };*/
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "action-profile-1-0:consequent-operation-reference": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Returns whether to be presented in new browser window
 *
 * uuid String 
 * returns inline_response_200_13
 **/
exports.getActionProfileDisplayInNewBrowserWindow = function (url) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
      "action-profile-1-0:display-in-new-browser-window": false
    };*/


    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "action-profile-1-0:display-in-new-browser-window": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Returns the list of input values
 *
 * uuid String 
 * returns inline_response_200_12
 **/
exports.getActionProfileInputValueListt = function (url) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
      "action-profile-1-0:input-value-list": [{
        "field-name": "Label of input field",
        "unit": "Unit at input field"
      }, {
        "field-name": "Label of input field",
        "unit": "Unit at input field"
      }]
    };*/
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "action-profile-1-0:input-value-list": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Returns the Label of the Action
 *
 * uuid String 
 * returns inline_response_200_11
 **/
exports.getActionProfileLabel = function (url) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
      "action-profile-1-0:label": "Inform about Application"
    };*/
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "action-profile-1-0:label": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Returns the name of the Operation
 *
 * uuid String 
 * returns inline_response_200_10
 **/
exports.getActionProfileOperationName = function (url) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
      "action-profile-1-0:operation-name": "/v1/start-application-in-generic-representation"
    };*/
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "action-profile-1-0:operation-name" : value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}


/**
 * Configures the reference on the consequent operation
 *
 * body Actionprofileconfiguration_consequentoperationreference_body 
 * uuid String 
 * no response value expected for this operation
 **/
exports.putActionProfileConsequentOperationReference = function (body, url) {
  return new Promise(async function (resolve, reject) {
    try {
      await fileOperation.writeToDatabaseAsync(url, body, false);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}

