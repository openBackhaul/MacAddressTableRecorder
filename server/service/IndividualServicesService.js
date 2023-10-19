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
const TcpClient = require('../service/TcpClientService');




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
  const layerList = await LogicalTerminationPointC.getLayerLtpListAsync(opLtpUuid);

  //const regex = /^http-client-interface-.*?LAYER_PROTOCOL_NAME_TYPE_HTTP_LAYER$/;

  let clientPac;
  let applicationName;
  let pacConfiguration;
  for (const layer of layerList) {
    let layerProtocolName = layer[onfAttributes.LAYER_PROTOCOL.LAYER_PROTOCOL_NAME];
    if (LayerProtocol.layerProtocolNameEnum.HTTP_CLIENT === layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.HTTP_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.HTTP_CLIENT.CONFIGURATION];
      applicationName = pacConfiguration[onfAttributes.HTTP_CLIENT.APPLICATION_NAME];
    }
    else if (LayerProtocol.layerProtocolNameEnum.ES_CLIENT === layerProtocolName) {
      clientPac = layer[onfAttributes.LAYER_PROTOCOL.ES_CLIENT_INTERFACE_PAC];
      pacConfiguration = clientPac[onfAttributes.ES_CLIENT.CONFIGURATION];
      applicationName = pacConfiguration[onfAttributes.ES_CLIENT.APPLICATION_NAME];
    }
  }


  return applicationName === undefined ? {
    applicationName: null/*,
    httpClientLtpUuid*/
  } : {
    applicationName/*,
    httpClientLtpUuid*/
  };
}


async function resolveApplicationNameAndHttpClientLtpUuidFromForwardingName2(forwardingName) {
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
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
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
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
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
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
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
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
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
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
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


/**
 * Responses with the current MAC table of a specific device.
 *
 * body V1_readcurrentmactablefromdevice_body 
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]' 
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * returns inline_response_200_2
 **/
exports.readCurrentMacTableFromDevice = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    /*var examples = {};
    examples['application/json'] = {
      "request-id": "305251234-101120-1400"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }*/
    const Authorization = "Basic c2lhZTpTaUdlbjAx";
    finalUrl = "OpenDayLight://rests/operations/network-topology:network-topology/topology=topology-netconf/node=513250009/yang-ext:mount/mac-fd-1-0:provide-learned-mac-addresses";
    const result = await RestClient.dispatchEvent(finalUrl, 'GET', '', Authorization);


  });
}

