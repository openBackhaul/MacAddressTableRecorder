'use strict';
const RestClient = require('./rest/client/dispacher')

const { elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const LogicalTerminationPointC = require('./custom/LogicalTerminationPointC');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const ForwardingConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const eventDispatcher = require('onf-core-model-ap/applicationPattern/rest/client/eventDispatcher');
const responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const operationClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationClientInterface');
const RequestHeader = require('onf-core-model-ap/applicationPattern/rest/client/RequestHeader');
const RestRequestBuilder = require('onf-core-model-ap/applicationPattern/rest/client/RequestBuilder');
const TcpClient = require('../service/TcpClientService');
const axios = require('axios');

async function resolveOperationNameAndOperationKeyFromForwardingName(forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  if (forwardingConstruct === undefined) {
    return null;
  }

  let fcPortOutputDirectionLogicalTerminationPointList = [];
  const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (const fcPort of fcPortList) {
    const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
    if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
      fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
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
    let layerProtocolName = layer[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT === layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
      operationKey = pacConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_KEY];
    }
    else if (LayerProtocol.layerProtocolNameEnum.ES_CLIENT == layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.ES_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.ES_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[onfAttributes.ES_CLIENT.AUTH];
      operationKey = pacConfiguration[onfAttributes.ES_CLIENT.INDEX_ALIAS];
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

async function resolveApplicationNameAndHttpClientLtpUuidFromForwardingName(forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  if (forwardingConstruct === undefined) {
    return null;
  }

  let fcPortOutputDirectionLogicalTerminationPointList = [];
  const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (const fcPort of fcPortList) {
    const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
    if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
      fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
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

async function resolveOperationNameAndOperationKeyFromForwardingName(forwardingName) {
  const forwardingConstruct = await ForwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  if (forwardingConstruct === undefined) {
    return null;
  }

  let fcPortOutputDirectionLogicalTerminationPointList = [];
  const fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
  for (const fcPort of fcPortList) {
    const portDirection = fcPort[onfAttributes.FC_PORT.PORT_DIRECTION];
    if (FcPort.portDirectionEnum.OUTPUT === portDirection) {
      fcPortOutputDirectionLogicalTerminationPointList.push(fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT]);
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
    let layerProtocolName = layer[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.OPERATION_CLIENT === layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.OPERATION_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.OPERATION_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_NAME];
      operationKey = pacConfiguration[onfAttributes.OPERATION_CLIENT.OPERATION_KEY];
    }
    else if (LayerProtocol.layerProtocolNameEnum.ES_CLIENT == layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.ES_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.ES_CLIENT.CONFIGURATION];
      operationName = pacConfiguration[onfAttributes.ES_CLIENT.AUTH];
      operationKey = pacConfiguration[onfAttributes.ES_CLIENT.INDEX_ALIAS];
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



/**
 * Initiates process of embedding a new release
 *
 * body V1_bequeathyourdataanddie_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.bequeathYourDataAndDie = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    resolve();
  });
}

function transformData(inputData) {
  const outputData = {
    "target-mac-address": `target-mac-address-${inputData["remote-mac-address"]}`,
    "mount-name": inputData["mount-name"],
    "original-ltp-name": inputData["original-ltp-name"],
    "vlan-id": inputData["vlan-id"],
    "time-stamp-of-data": new Date(inputData["time-stamp-of-data"]).toISOString()
  };

  return outputData;
}

/**
 * Provides unsorted list of network element interfaces on path to specific MAC address.
 *
 * body V1_providelistofnetworkelementinterfacesonpath_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns List
 **/
exports.provideListOfNetworkElementInterfacesOnPath = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);
    let targetMacAddress = body['target-mac-address'];

    let res2 = await client.search({
      index: '6',
      _source: 'mac-address',
      body: {
        query: {
          match: {
            'mac-address.remote-mac-address.keyword': targetMacAddress
          }
        }
      }
    });

    let mergedArray = [];

    const hits = res2.body.hits.hits;
    for (const hit of hits) {
      const source = hit._source['mac-address'];
      mergedArray = mergedArray.concat(source);
    }

    const filteredObjects = mergedArray.filter(obj => obj['remote-mac-address'] === targetMacAddress);

    const transformedArray = filteredObjects.map(obj => transformData(obj));

    var response = {};
    response['application/json'] = {
      'targetMacAddress': transformedArray
    };

    if (Object.keys(response).length > 0) {
      resolve(response['application/json']['targetMacAddress']);
    } else {
      resolve();
    }



  });
}


/**
 * Provides unsorted list of network element interfaces on path to specific MAC address in generic representation.
 *
 * body V1_providelistofnetworkelementinterfacesonpathingenericrepresentation_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns genericRepresentation
 **/
exports.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "consequent-action-list": [{
        "request": "request",
        "input-value-list": [{
          "field-name": "field-name",
          "unit": "unit"
        }, {
          "field-name": "field-name",
          "unit": "unit"
        }],
        "display-in-new-browser-window": true,
        "label": "label"
      }, {
        "request": "request",
        "input-value-list": [{
          "field-name": "field-name",
          "unit": "unit"
        }, {
          "field-name": "field-name",
          "unit": "unit"
        }],
        "display-in-new-browser-window": true,
        "label": "label"
      }],
      "response-value-list": [{
        "field-name": "field-name",
        "datatype": "datatype",
        "value": "value"
      }, {
        "field-name": "field-name",
        "datatype": "datatype",
        "value": "value"
      }]
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Responses with a list of MAC tables of all connected devices.
 *
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns List
 **/
exports.provideMacTableOfAllDevices = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {

    let client = await elasticsearchService.getClient(false);

    let res2 = await client.search({
      index: '6', // Sostituisci con il nome del tuo indice
      _source: 'mac-address',
      body: {
        query: {
          match: {
            'datatype': 'mac-address'
          }
        }
      }
    });

    const response = { 'application/json': [] };

    const hits = res2.body.hits.hits;
    for (const hit of hits) {
      const source = hit._source['mac-address'];

      for (const element of source) {
        response['application/json'].push(element);
      }
    }

    if (Object.keys(response).length > 0) {
      resolve(response['application/json']);
    } else {
      resolve();
    }

  });
}



/**
 * Responses with the MAC table of a specific device.
 *
 * body V1_providemactableofspecificdevice_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns List
 **/
exports.provideMacTableOfSpecificDevice = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {

    let client = await elasticsearchService.getClient(false);
    let mountName = body['mount-name'];


    let res2 = await client.get({
      index: '6',
      id: mountName
    });


    var source = res2.body._source['mac-address'];

    var response = {};
    response['application/json'] = {
      'mac-address': source
    };

    if (Object.keys(response).length > 0) {
      resolve(response['application/json']['mac-address']);
    } else {
      resolve();
    }
  });

}

/**
 * @description To decode base64 authorization code from authorization header
 * @param {String} authorizationCode base64 encoded authorization code
 * @returns {String|undefined} user name based on the decoded authorization code
 **/
exports.decodeAuthorizationCodeAndExtractUserName = function (authorizationCode) {
  try {
    let base64EncodedString = authorizationCode.split(" ")[1];
    let base64BufferObject = Buffer.from(base64EncodedString, "base64");
    let base64DecodedString = base64BufferObject.toString("utf8");
    let userName = base64DecodedString.split(":")[0];
    console.log(`decoded user name: ${userName}`);
    return userName;
  } catch (error) {
    console.error(`Could not decode authorization code "${authorizationCode}". Got ${error}.`);
    return undefined;
  }
}


function customEncode(input) {
  return input
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/;/g, '%3B')
    .replace(/:/g, '%3A');
}


//STEP 1
async function PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let applicationNameAndHttpClient =
      await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi');

    let operationNameAndOperationKey =
      await resolveOperationNameAndOperationKeyFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi');

    let httpClientLtpUuid = applicationNameAndHttpClient.httpClientLtpUuid;
    let applicationName = applicationNameAndHttpClient.applicationName;
    let operationName = operationNameAndOperationKey.operationName;
    let operationKey = operationNameAndOperationKey.operationKey;

    let logicalTerminationPointListTCP = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.TCP_CLIENT);
    let ltpTcpUuid;
    for (const ltp of logicalTerminationPointListTCP) {
      const clientLtp = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      if (applicationNameAndHttpClient.httpClientLtpUuid === clientLtp[0]) {
        ltpTcpUuid = ltp[onfAttributes.GLOBAL_CLASS.UUID];
      }
    }

    let remoteTcpAddress = await tcpClientInterface.getRemoteAddressAsync(ltpTcpUuid);
    let remoteTcpPort = await tcpClientInterface.getRemotePortAsync(ltpTcpUuid);

    let finalUrl = "http://" + remoteTcpAddress["ip-address"]["ipv-4-address"] + ":" + remoteTcpPort + operationName;

    let originator = await httpServerInterface.getApplicationNameAsync();
    let httpRequestHeader = new RequestHeader(
      user,
      originator,
      xCorrelator,
      traceIndicator,
      customerJourney,
      operationKey
    );
    httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);

    let splitUrl = finalUrl.split('fields=');

    let fields = "";
    let url = "";
    let baseUrl = "";

    let mountName = body['mount-name'];

    if (splitUrl.length > 1) {
      baseUrl = splitUrl[0];
      fields = splitUrl[1];
      console.log("url = " + baseUrl + "fields =" + fields);
    }

    let newBaseUrl = baseUrl.replace("{mount-name}", mountName);

    const encodedFields = customEncode(fields);
    const fullUrl = newBaseUrl + 'fields=' + encodedFields;

    try {
      let response = await axios.get(fullUrl, {
        headers: httpRequestHeader
      });
      return (response.data);
    } catch (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
}

//STEP 2
async function PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let applicationNameAndHttpClient =
      await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice');

    let operationNameAndOperationKey =
      await resolveOperationNameAndOperationKeyFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice');

    let httpClientLtpUuid = applicationNameAndHttpClient.httpClientLtpUuid;
    let applicationName = applicationNameAndHttpClient.applicationName;
    let operationName = operationNameAndOperationKey.operationName;
    let operationKey = operationNameAndOperationKey.operationKey;

    let logicalTerminationPointListTCP = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.TCP_CLIENT);
    let ltpTcpUuid;
    for (const ltp of logicalTerminationPointListTCP) {
      const clientLtp = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      if (applicationNameAndHttpClient.httpClientLtpUuid === clientLtp[0]) {
        ltpTcpUuid = ltp[onfAttributes.GLOBAL_CLASS.UUID];
      }
    }

    let remoteTcpAddress = await tcpClientInterface.getRemoteAddressAsync(ltpTcpUuid);
    let remoteTcpPort = await tcpClientInterface.getRemotePortAsync(ltpTcpUuid);

    let finalUrl = "http://" + remoteTcpAddress["ip-address"]["ipv-4-address"] + ":" + remoteTcpPort + operationName;

    let originator = await httpServerInterface.getApplicationNameAsync();
    let httpRequestHeader = new RequestHeader(
      user,
      originator,
      xCorrelator,
      traceIndicator,
      customerJourney,
      operationKey
    );
    httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);

    let mountName = body['mount-name'];

    let fullUrl = finalUrl.replace("{mount-name}", mountName);

    try {
      let response = await axios.get(fullUrl, {
        headers: httpRequestHeader
      });
      return (response.data);
    } catch (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
}



//STEP 3
async function PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    // matr-1-0-0-op-c-is-mwdi-1-0-0-001
    let applicationNameAndHttpClient =
      await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi');

    let operationNameAndOperationKey =
      await resolveOperationNameAndOperationKeyFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi');

    let httpClientLtpUuid = applicationNameAndHttpClient.httpClientLtpUuid;
    let applicationName = applicationNameAndHttpClient.applicationName;
    let operationName = operationNameAndOperationKey.operationName;
    let operationKey = operationNameAndOperationKey.operationKey;

    let logicalTerminationPointListTCP = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.TCP_CLIENT);
    let ltpTcpUuid;
    for (const ltp of logicalTerminationPointListTCP) {
      const clientLtp = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      if (applicationNameAndHttpClient.httpClientLtpUuid === clientLtp[0]) {
        ltpTcpUuid = ltp[onfAttributes.GLOBAL_CLASS.UUID];
      }
    }

    let remoteTcpAddress = await tcpClientInterface.getRemoteAddressAsync(ltpTcpUuid);
    let remoteTcpPort = await tcpClientInterface.getRemotePortAsync(ltpTcpUuid);

    let finalUrl = "http://" + remoteTcpAddress["ip-address"]["ipv-4-address"] + ":" + remoteTcpPort + operationName;

    let mountName = body['mount-name'];
    let uuid = body['mount-name'];

    let finalUrlTmp = finalUrl.replace("{mount-name}", mountName);
    finalUrl = finalUrlTmp.replace("{uuid}", uuid);

    let httpRequestHeader = new RequestHeader(
      user,
      originator,
      xCorrelator,
      traceIndicator,
      customerJourney,
      operationKey
    );
    httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);

    try {
      let response = await axios.get(finalUrl, {
        headers: httpRequestHeader
      });
      return (response.data);
    } catch (error) {
      throw error;
    }

    console.log("url = " + finalUrl);
  } catch (error) {
    throw error;
  }
}


//STEP4
async function PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let applicationNameAndHttpClient =
      await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch');

    let operationNameAndOperationKey =
      await resolveOperationNameAndOperationKeyFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch');

    let httpClientLtpUuid = applicationNameAndHttpClient.httpClientLtpUuid;
    let applicationName = applicationNameAndHttpClient.applicationName;
    let operationName = operationNameAndOperationKey.operationName;
    let operationKey = operationNameAndOperationKey.operationKey;

    let logicalTerminationPointListTCP = await controlConstruct.getLogicalTerminationPointListAsync(LayerProtocol.layerProtocolNameEnum.TCP_CLIENT);
    let ltpTcpUuid;
    for (const ltp of logicalTerminationPointListTCP) {
      const clientLtp = ltp[onfAttributes.LOGICAL_TERMINATION_POINT.CLIENT_LTP];
      if (applicationNameAndHttpClient.httpClientLtpUuid === clientLtp[0]) {
        ltpTcpUuid = ltp[onfAttributes.GLOBAL_CLASS.UUID];
      }
    }

    let remoteTcpAddress = await tcpClientInterface.getRemoteAddressAsync(ltpTcpUuid);
    let remoteTcpPort = await tcpClientInterface.getRemotePortAsync(ltpTcpUuid);

    let finalUrl = "http://" + remoteTcpAddress["ip-address"]["ipv-4-address"] + ":" + remoteTcpPort + "/" + operationKey + "/_doc/305251234";

    var data = {
      "datatype": "mac-address",
        "mac-address":
      [
        {
          "mount-name": "305251234",
          "own-mac-address": "00:00:00:00:00:00",
          "egress-ltp-uuid": "305251234+mac-inf-VALE",
          "original-ltp-name": "eth-1-0-3",
          "vlan-id": 17,
          "remote-mac-address": "01:01:01:01:01:01",
          "time-stamp-of-data": "2010-11-20T13:00:00.000Z"
        },
        {
          "mount-name": "305251234",
          "own-mac-address": "00:00:00:00:00:00",
          "egress-ltp-uuid": "305251234+mac-inf-VALE",
          "original-ltp-name": "eth-1-0-3",
          "vlan-id": 17,
          "remote-mac-address": "FF:01:01:01:01:01",
          "time-stamp-of-data": "2010-11-20T13:00:00.000Z"
        }
      ]};


      let originator = await httpServerInterface.getApplicationNameAsync();
      let httpRequestHeader = new RequestHeader(
        user,
        originator,
        xCorrelator,
        traceIndicator,
        customerJourney,
        operationKey
      );

      httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);


      let additionalHeaders = {
        'Authorization': operationName['api-key'],
      };
    
      let headersAll = {
        httpRequestHeader, 
        additionalHeaders //custom header
      };


      try {
        let response = await axios.post(finalUrl, data, {
          headers: headersAll
        });
        return response.data;
      } catch (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  }




/**
 * Responses with the current MAC table of a specific device.
 *
 * body V1_readcurrentmactablefromdevice_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customerâ€™s journey to which the execution applies
 * returns inline_response_200_2
 **/
exports.readCurrentMacTableFromDevice = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
    let dataFromRequest;
    const uuidArray = [];

    return new Promise(async function (resolve, reject) {

      //STEP1 - MIDW call (MWDI://core-model-1-4:network-control-domain=cache/control-construct={mount-name}?\nfields=forwarding-domain(uuid;layer-protocol-name;mac-fd-1-0:mac-fd-pac(mac-fd-status(mac-address-cur))))
      /*
      PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(body, user, originator, xCorrelator, traceIndicator, customerJourney)
        .then(data => {
          dataFromRequest = data;
          data["core-model-1-4:control-construct"].forEach(controlConstruct => {
            controlConstruct["forwarding-domain"].forEach(forwardingDomain => {
              if (
                forwardingDomain["layer-protocol-name"].includes(
                  "mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER"
                )
              ) {
                uuidArray.push(forwardingDomain.uuid);
              }
            });
          });
        })
        .catch(error => {
          console.error('Errore durante la richiesta:', error);
        });
        */


      //STEP2 - ODL call (ODL://...mac-fd-1-0:provide-learned-mac-addresses)
      /*
      PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney)
        .then(data => {
          dataFromRequest = data;      })
        .catch(error => {
          console.error('Errore durante la richiesta:', error);
      });
      */


      //STEP3 - MIDW call (MWDI://core-model-1-4:network-control-domain=cache/control-construct={mount-name}/logical-termination-point={uuid}/ltp-augment-1-0:ltp-augment-pac?\nfields=original-ltp-name)
      /*
      PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(body, user, originator, xCorrelator, traceIndicator, customerJourney)
      .then(data => {
        dataFromRequest = data;
      })
      .catch(error => {
        console.error('Errore durante la richiesta:', error);
      });
      */

      //STEP4 - PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch
      //"ElasticSearch": {MountName, macAddressCur, egressLtpUUid, originalLtpName, vlanId, macAddresses, timeStampOfRpc}
      PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(body, user, originator, xCorrelator, traceIndicator, customerJourney)
        .then(data => {
          dataFromRequest = data;
        })
        .catch(error => {
          console.error('Errore durante la richiesta:', error);
        });




    });



  }


