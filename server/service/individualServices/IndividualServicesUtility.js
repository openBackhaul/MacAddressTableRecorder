'use strict';



const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const ProfileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const ControlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');

const OnfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const OnfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const FileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');

const createHttpError = require('http-errors');
const fileSystem = require('fs');
const AsyncLock = require('async-lock');
const lock = new AsyncLock();

const logger = require('../LoggingService.js').getLogger();
const LogicalTerminationPointC = require('./../custom/LogicalTerminationPointC');

/**
 * This function fetches the integer value from the integer profile based on the expected integer name.
 * @param {String} expectedIntegerName name of the integer profile.
 * @return {String} value of the integer profile.
 */
exports.getIntegerProfileInstanceValue = async function(expectedIntegerName) {
  let integerValue = "";
  try {
    let integerProfileName = "integer-profile-1-0:PROFILE_NAME_TYPE_INTEGER_PROFILE";
    let integerProfileInstanceList = await ProfileCollection.getProfileListForProfileNameAsync(integerProfileName);

    for (let i = 0; i < integerProfileInstanceList.length; i++) {
      let integerProfileInstance = integerProfileInstanceList[i];
      let integerProfilePac = integerProfileInstance[OnfAttributes.INTEGER_PROFILE.PAC];
      let integerProfileCapability = integerProfilePac[OnfAttributes.INTEGER_PROFILE.CAPABILITY];
      let integerName = integerProfileCapability[OnfAttributes.INTEGER_PROFILE.INTEGER_NAME];
      if (integerName == expectedIntegerName) {
        let integerProfileConfiguration = integerProfilePac[OnfAttributes.INTEGER_PROFILE.CONFIGURATION];
        integerValue = integerProfileConfiguration[OnfAttributes.INTEGER_PROFILE.INTEGER_VALUE];
        break;
      }
    }

    return integerValue;
  } catch (error) {
    logger.error(`getIntegerProfileInstanceValue is not success with ${error}`);
    return new createHttpError.InternalServerError();
  }
}

// Avoid to read everytime from file
let stringProfileInstanceList = "";
/**
 * This function fetches the string value from the string profile based on the expected string name.
 * @param {String} expectedStringName string name of the string profile.
 * @return {String} string value of the string profile.
 */
exports.getStringProfileInstanceValue = async function (expectedStringName) {
  let stringValue = "";
  try {
    if (stringProfileInstanceList == "") {
      let stringProfileName = "string-profile-1-0:PROFILE_NAME_TYPE_STRING_PROFILE";
      stringProfileInstanceList = await ProfileCollection.getProfileListForProfileNameAsync(stringProfileName);
    }

    for (let i = 0; i < stringProfileInstanceList.length; i++) {
      let stringProfileInstance = stringProfileInstanceList[i];
      let stringProfilePac = stringProfileInstance[OnfAttributes.STRING_PROFILE.PAC];
      let stringProfileCapability = stringProfilePac[OnfAttributes.STRING_PROFILE.CAPABILITY];
      let stringName = stringProfileCapability[OnfAttributes.STRING_PROFILE.STRING_NAME];
      if (stringName == expectedStringName) {
        let stringProfileConfiguration = stringProfilePac[OnfAttributes.STRING_PROFILE.CONFIGURATION];
        stringValue = stringProfileConfiguration[OnfAttributes.STRING_PROFILE.STRING_VALUE];
        break;
      }
    }
    return stringValue;

  } catch (error) {
    logger.error(`getStringProfileInstanceValue is not success with ${error}`);
    return new createHttpError.InternalServerError(`${error}`);
  }
}

exports.getForwardingConstructForTheForwardingNameAsync = async function(forwardingName) {
  let res = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  return res;
}

exports.getLTPtcpClient = async function() {
  let res = await ControlConstruct.getLogicalTerminationPointListAsync(
      LayerProtocol.layerProtocolNameEnum.TCP_CLIENT);

  return res;
}


// /**
//  * This function gets the consequent operation details like op-c uuid , operation-name, field parameters.
//  * @param {String} forwardingConstructName name of the forwarding construct to fetch consequent op-c uuid.
//  * @param {String} stringName string name to fetch the field parameter.
//  * @return {Object} consequentOperationClientAndFieldParams that contains op-c uuid , operation-name, field parameters.
//  */
// exports.getConsequentOperationClientAndFieldParams = async function(forwardingConstructName, stringName = forwardingConstructName) {
//   let consequentOperationClientAndFieldParams = {};
//   try {
//     let forwardingConstructInstance = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingConstructName);
//     let outputFcPortForFc = await ForwardingConstruct.getOutputFcPortsAsync(forwardingConstructInstance[onfAttributes.GLOBAL_CLASS.UUID]);
//     consequentOperationClientAndFieldParams.operationClientUuid = outputFcPortForFc[0][onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]; 
//     consequentOperationClientAndFieldParams.operationName = await OperationClientInterface.getOperationNameAsync(consequentOperationClientAndFieldParams.operationClientUuid);
//     consequentOperationClientAndFieldParams.fields = await IndividualServiceUtility.getStringProfileInstanceValue(stringName);
//   } catch(error) {
//     logger.error(error, "getConsequentOperationClientAndFieldParams is not success");
//     return new createHttpError.InternalServerError(`${error}`);
//   }

//   return consequentOperationClientAndFieldParams;
// }

// /**
//  * @description This function automates the forwarding of request with related pathParameters and consequent op-c.
//  * @param {Object} operationClientAndFieldParams operationClientAndFieldParams that contains op-c uuid , operation-name, field parameters of the request.
//  * @param {list}   pathParamList list of path parameters values to be sent in request.
//  * @param {Integer} traceIndicatorIncrementer incrementer value to increment the trace indicator.
//  * @returns {Object} response data fetched for the forwarded request
//  **/
// exports.forwardRequest = async function (operationClientAndFieldParams, pathParamList, requestHeaders, traceIndicatorIncrementer) {
//   try {
//     logger.debug(`Forwarding request, Traceindicator incrementer: ${traceIndicatorIncrementer}`);

//     let operationName = operationClientAndFieldParams.operationName;
//     let fields = operationClientAndFieldParams.fields;
//     let operationClientUuid = operationClientAndFieldParams.operationClientUuid;
//     let params = IndividualServiceUtility.getQueryAndPathParameter(operationName, pathParamList, fields);

//     let responseData = await eventDispatcher.dispatchEvent(
//       operationClientUuid,
//       {},
//       requestHeaders.user,
//       requestHeaders.xCorrelator,
//       // "1.3.1" + incr,
//       requestHeaders.traceIndicator + "." + traceIndicatorIncrementer,
//       requestHeaders.customerJourney,
//       "GET",
//       params
//     );

//     // logger.debug(responseData); // Better to avoid printing

//     return responseData;
//   } catch (error) {
//     logger.error(error, "forwardRequest is not success");
//     return new createHttpError.InternalServerError(`${error}`);
//   }
// }

exports.extractProfileConfiguration = async function (uuid) {
  let profile = await ProfileCollection.getProfileAsync(uuid);
  let objectKey = Object.keys(profile)[2];
  profile = profile[objectKey];
  return profile["integer-profile-configuration"]["integer-value"];
}


/** 
 * Write to the filesystem.<br>
 * @param {JSON} coreModelJsonObject json object that needs to be updated
 * @returns {Boolean} return true if the value is updated, otherwise returns false
 **/
exports.resetCompleteFile = async function (coreModelJsonObject) { 
  let controlConstructPath = OnfPaths.CONTROL_CONSTRUCT;
  let resultDel = await FileOperation.deletefromDatabaseAsync(controlConstructPath);
  if (!resultDel) {
    return resultDel;
  }
  
  return await lock.acquire(global.databasePath, async () => {
    let result = writeToFile(coreModelJsonObject);
    return result;
  });

  /**
   * Write to the filesystem.<br>
   * @param {JSON} coreModelJsonObject json object that needs to be updated
   * @returns {Boolean} return true if the value is updated, otherwise returns false
   **/
  function writeToFile(coreModelJsonObject) {
    try {
      fileSystem.writeFileSync(global.databasePath, JSON.stringify(coreModelJsonObject));
      return true;
    } catch (error) {
      logger.error('write failed:', error)
      return false;
    }
  }
}

exports.generateRequestId = async function (mountName, linkId) {
  const timestamp = Date.now(); // Get current timestamp
  return mountName + "-" + linkId + "-" + `${timestamp}`;
}

exports.resolveOperationNameAndOperationKeyFromForwardingName = async function (forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  if (forwardingConstruct === undefined) {
    return null;
  }

  let fcPortOutputDirectionLogicalTerminationPointList = [];
  const fcPortList = forwardingConstruct[OnfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (const fcPort of fcPortList) {
    const portDirection = fcPort[OnfAttributes.FC_PORT.PORT_DIRECTION];
    if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
      fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[OnfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
    }
  }

  if (fcPortOutputDirectionLogicalTerminationPointList.length !== 1) {
    return null;
  }

  const opLtpUuid = fcPortOutputDirectionLogicalTerminationPointList[0];
  const logicalTerminationPointLayer = await LogicalTerminationPointC.getLayerLtpListAsync(opLtpUuid);

  let clientPac;
  let pacConfiguration;
  let operationName;
  let operationKey;
  for (const layer of logicalTerminationPointLayer) {
    let layerProtocolName = layer[OnfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT === layerProtocolName) {
      clientPac = layer[OnfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[OnfAttributes.OPERATION_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[OnfAttributes.OPERATION_CLIENT.OPERATION_NAME];
      operationKey = pacConfiguration[OnfAttributes.OPERATION_CLIENT.OPERATION_KEY];
    }
    else if (LayerProtocol.layerProtocolNameEnum.ES_CLIENT == layerProtocolName) {
      clientPac = layer[OnfAttributes.LAYER_PROTOCOL.ES_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[OnfAttributes.ES_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[OnfAttributes.ES_CLIENT.AUTH];
      operationKey = pacConfiguration[OnfAttributes.ES_CLIENT.INDEX_ALIAS];
    }
  }

  return operationName === undefined ? {
    operationName: null,
    operationKey
  } : {
    operationName,
    operationKey
  };
}

exports.resolveApplicationNameAndHttpClientLtpUuidFromForwardingName = async function (forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  if (forwardingConstruct === undefined) {
    return null;
  }

  let fcPortOutputDirectionLogicalTerminationPointList = [];
  const fcPortList = forwardingConstruct[OnfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (const fcPort of fcPortList) {
    const portDirection = fcPort[OnfAttributes.FC_PORT.PORT_DIRECTION];
    if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
      fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[OnfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
    }
  }

  if (fcPortOutputDirectionLogicalTerminationPointList.length !== 1) {
    return null;
  }

  const opLtpUuid = fcPortOutputDirectionLogicalTerminationPointList[0];
  const httpLtpUuidList = await LogicalTerminationPoint.getServerLtpListAsync(opLtpUuid);

  const httpClientLtpUuid = httpLtpUuidList[0];
  const applicationName = await httpClientInterface.getApplicationNameAsync(httpClientLtpUuid);
  return applicationName === undefined ? {
    applicationName: null,
    httpClientLtpUuid
  } : {
    applicationName,
    httpClientLtpUuid
  };
}