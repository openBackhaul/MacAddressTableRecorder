'use strict';

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



const RequestForListOfConnectedEquipmentFromElasticSearch = async function () {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);
    let mountList;

    let res2 = await client.search({
      index: '6',
      _source: 'mountName-list'
    });

    let mergedArray = [];

    const hits = res2.body.hits.hits;
    for (const hit of hits) {
      mountList = hit._source['mountName-list'];
    }
    var response = {};
    response['application/json'] = {
      'mountName-list': mountList
    };

    if (Object.keys(response).length > 0) {
      resolve(response['application/json']);
    } else {
      resolve();
    }

  });
};



const RequestForWriteListConnectedEquipmentIntoElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {
    //let indexAlias = await getIndexAliasAsync();
    let client = await elasticsearchService.getClient(false);

    let result = await client.index({
      index: 6,
      id: 'mountName - list',
      body: body
    });


    if (Object.keys(result).length > 0) {
      resolve(result);
    } else {
      resolve();
    }
  });
};


const RequestForDeleteEquipmentIntoElasticSearch = async function (mountName) {
  return new Promise(async function (resolve, reject) {
    //let indexAlias = await getIndexAliasAsync();
    let client = await elasticsearchService.getClient(false);

    let result = await client.delete({
      index: 6,
      id: mountName
    });

    resolve(result);

    if (Object.keys(result).length > 0) {
      resolve(result);
    } else {
      resolve();
    }
  });
};



const findNotConnectedElements = async function (listJsonES, listJsonMD) {
  return new Promise(async function (resolve, reject) {

    const listES = listJsonES["mountName-list"];
    const listMD = listJsonMD["mountName-list"];

    // Filter the elements present in listES but not in listMD
    const missingElements = listES.filter(element => !listMD.includes(element));

    if (missingElements.length > 0) {
      // Create a new JSON object with the result
      const resultJSON = {
        "mountName - list": missingElements
      };
      resolve(resultJSON);
    }
    else {
      resolve(null);
    }
  });
}


exports.updateCurrentConnectedEquipment = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {

  //"mountName - list" from ES
  let oldConnectedListFromES = await RequestForListOfConnectedEquipmentFromElasticSearch();

  //mountName - list from network/Mwdi
  let newConnectedListFromMwdi = await EmbeddingCausesRequestForListOfDevicesAtMwdi(body, user, originator, xCorrelator, traceIndicator, customerJourney);

  //list of equipment that was connected (mac-address data in ES) but now that are not connected
  const listJsonDisconnectedEq = await findNotConnectedElements(oldConnectedListFromES, newConnectedListFromMwdi);

  if (listJsonDisconnectedEq != null)
  {
    let listDisconnectedEq = listJsonDisconnectedEq["mountName-list"];
    //console.log("Number of disconnected equipment:" + listDisconnectedEq + "=> remove mac-adress data from ES");

    //remove mac-address data in ES of equipment that are that are no longer connected  
    for (const elementToRemove of listDisconnectedEq) {
      const mountName = listES.indexOf(elementToRemove);
      RequestForDeleteEquipmentIntoElasticSearch(mountName);
    }
  }

  //Write new "mountName - list" list into ES
  let result = await RequestForWriteListConnectedEquipmentIntoElasticSearch(newConnectedListFromMwdi);
}

const EmbeddingCausesRequestForListOfDevicesAtMwdi = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      let applicationNameAndHttpClient =
        await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('EmbeddingCausesRequestForListOfDevicesAtMwdi');

      let operationNameAndOperationKey =
        await resolveOperationNameAndOperationKeyFromForwardingName('EmbeddingCausesRequestForListOfDevicesAtMwdi');

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
      console.log("url = " + finalUrl);

      //TO FIX
      let auth = "Basic YWRtaW46YWRtaW4=";

      if (operationKey === 'Operation key not yet provided.')
        operationKey = "siaeTest";


      let httpRequestHeader = new RequestHeader(
        user,
        originator,
        xCorrelator,
        traceIndicator,
        customerJourney,
        operationKey
      );

      let httpRequestHeaderAuth = {
        "content-type": httpRequestHeader['contentType'],
        "user": httpRequestHeader['user'],
        "originator": httpRequestHeader['originator'],
        "x-correlator": httpRequestHeader['xCorrelator'],
        "trace-indicator": httpRequestHeader['traceIndicator'],
        "customer-journey": httpRequestHeader['customerJourney'],
        "operation-key": httpRequestHeader['operationKey'],
        "Authorization": auth
      };

      httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeaderAuth);

      //empty body
      body = {
        "input":
          {}
      };

      try {
        let response = await axios.post(finalUrl, body, {
          headers: httpRequestHeaderAuth
        });
        resolve(response.data);
      } catch (error) {
        throw error;
      }

    } catch (error) {
      throw error;
    }
  });
};





const RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch = async function (body) {
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
};

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
  return new Promise(function (resolve, reject) {
    RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch(body)
      .then(function (response) {
        resolve(response);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};



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



function orderData(input) {

  const output = {
    "mount-name": input['mount-name'],
    "own-mac-address": input['own-mac-address'],
    "egress-ltp-uuid": input['egress-ltp-uuid'],
    "original-ltp-name": input['original-ltp-name'],
    "vlan-id": input['vlan-id'],
    "remote-mac-address": input['remote-mac-address'],
    "time-stamp-of-data": input['time-stamp-of-data']
  };

  return output;
}

const PromptForProvidingAllMacTablesCausesReadingFromElasticSearch = async function () {
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
};

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
  return new Promise(function (resolve, reject) {
    PromptForProvidingAllMacTablesCausesReadingFromElasticSearch()
      .then(function (response) {
        const orderedArray = response.map(obj => orderData(obj));
        //console.log("Data from orderedArray:", response);   
        resolve(orderedArray);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};


const PromptForProvidingSpecificMacTableCausesReadingFromElasticSearch = async function (body) {
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
      resolve(null); // Resolve the promise with null if necessary
    }
  });
};



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
  return new Promise(function (resolve, reject) {
    PromptForProvidingSpecificMacTableCausesReadingFromElasticSearch(body)
      .then(function (response) {
        //console.log("Data from provideMacTableOfSpecificDevice:", response);      
        resolve(response);
      })
      .catch(function (error) {
        reject(error);
      });
  });
};


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
async function PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(mountName, user, originator, xCorrelator, traceIndicator, customerJourney) {
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
async function PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney) {
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



    let fullUrl = finalUrl.replace("{mount-name}", mountName);

    var data = {
      "input":
        {}
    };

    //TO FIX
    let auth = "Basic YWRtaW46YWRtaW4=";

    let httpRequestHeaderAuth = {
      "content-type": httpRequestHeader['contentType'],
      "user": httpRequestHeader['user'],
      "originator": httpRequestHeader['originator'],
      "x-correlator": httpRequestHeader['xCorrelator'],
      "trace-indicator": httpRequestHeader['traceIndicator'],
      "customer-journey": httpRequestHeader['customerJourney'],
      "operation-key": httpRequestHeader['operationKey'],
      "Authorization": auth
    };

    httpRequestHeaderAuth = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeaderAuth);


    try {
      let response = await axios.post(fullUrl, data, {
        headers: httpRequestHeaderAuth
      });
      return response.data;
    } catch (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
}


//STEP 3
async function PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(body, uuid, originator, xCorrelator, traceIndicator, customerJourney) {
  try {

    if (body['egress-ltp'] == "LTP-MNGT") {
      body['original-ltp-name'] = "LAN-MNGT"
      return body;
    }

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

    uuid = mountName + "+" + uuid;

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
    let mountName = body["mac-address"][0]["mount-name"];

    let finalUrl = "http://" + remoteTcpAddress["ip-address"]["ipv-4-address"] + ":" + remoteTcpPort + "/" + operationKey + "/_doc/" + mountName;


    var data = body;

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
/*
exports.readCurrentMacTableFromDevice = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let dataFromRequest;
  const uuidArray = [];
  let egressArray = [];
  let uuidEgress = 0;
 
 
  return new Promise(async function (resolve, reject) {
    let error = false;
    //STEP1 - MIDW call (MWDI://core-model-1-4:network-control-domain=cache/control-construct={mount-name}?\nfields=forwarding-domain(uuid;layer-protocol-name;mac-fd-1-0:mac-fd-pac(mac-fd-status(mac-address-cur))))
 
    let mountName = body['mount-name'];
    PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(mountName, user, originator, xCorrelator, traceIndicator, customerJourney)
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
 
        if (uuidArray.length != 0) {
          //STEP2 - ODL call (POST ODL://...mac-fd-1-0:provide-learned-mac-addresses)      
          PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney)
            .then(data => {
              dataFromRequest = data;
 
              const egressSet = new Set(); // Utilizza un Set per memorizzare valori univoci
 
              dataFromRequest["mac-fd-1-0:output"]["mac-table-entry-list"].forEach(entry => {
                if (entry["affected-mac-fd"] === "MAC-FD") {
                  egressSet.add(entry["egress-ltp"]);
                }
              });
 
              egressArray = Array.from(egressSet);
 
              const promises = egressArray.map(uuid => {
                //STEP3
                PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(mountName, uuid, originator, xCorrelator, traceIndicator, customerJourney)
                  .then(data => {
                    // Esegui operazioni sui dati
                    console.log('Dati:', data);
                    return data; // Restituisci il valore per la promessa
                  })
                  .catch(error => {
                    // Gestisci l'errore per questa promessa, ma continua con le altre
                    console.error('Errore durante la richiesta:', error);
                    return null; // Restituisci un valore speciale o null, se necessario
                  });
              });
 
            })
            .catch(error => {
              console.error('Error during request:', error);
              error = true;
            });
        }
      })
      .catch(error => {
        console.error('Error during request:', error);
        error = true;
      });*/



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
/*
PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(body, user, originator, xCorrelator, traceIndicator, customerJourney)
  .then(data => {
    dataFromRequest = data;
  })
  .catch(error => {
    console.error('Errore durante la richiesta:', error);
  });
*/

// });
//}


function createMacAddressEntry(mountName, ownMacAddress, egressLtpUuid, originalLtpName, vlanId, remoteMacAddress, timeStamp) {
  return {
    "mount-name": mountName,
    "own-mac-address": ownMacAddress,
    "egress-ltp-uuid": egressLtpUuid,
    "original-ltp-name": originalLtpName,
    "vlan-id": parseInt(vlanId),
    "remote-mac-address": remoteMacAddress,
    "time-stamp-of-data": timeStamp
  };
}

function createMacAddressData(datatype, macAddressArray) {
  return {
    "datatype": datatype,
    "mac-address": macAddressArray
  };
}


exports.readCurrentMacTableFromDevice = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {

  const FDomainArray = [];
  let step2DataArray = [];
  let macAddressArray = [];

  try {

    //STEP1
    const mountName = body['mount-name'];
    const data = await PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(mountName, user, originator, xCorrelator, traceIndicator, customerJourney);

    data["core-model-1-4:control-construct"].forEach(controlConstruct => {
      controlConstruct["forwarding-domain"].forEach(forwardingDomain => {
        if (
          forwardingDomain["layer-protocol-name"].includes(
            "mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER"
          )
        ) {
          FDomainArray.push(forwardingDomain);
        }
      });
    });


    if (FDomainArray.length > 0) {
      const dataFromRequest = await PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney);

      let uuid = FDomainArray[0]['uuid'].split("+")[1];
      let macAddressCur = FDomainArray[0]['mac-fd-1-0:mac-fd-pac']['mac-fd-status']['mac-address-cur'];

      const egressSet = new Set();
      dataFromRequest["mac-fd-1-0:output"]["mac-table-entry-list"].forEach(entry => {
        if (entry["affected-mac-fd"] === uuid) {
          entry["own-mac-address"] = macAddressCur;
          egressSet.add(entry);
        }
      });

      const step2DataArray = Array.from(egressSet);

      const originalLtpNamePromises = step2DataArray.map(egressData => {
        return PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(egressData, user, originator, xCorrelator, traceIndicator, customerJourney);
      });

      const step3DataArray = await Promise.all(originalLtpNamePromises);

      //TO FIX: Timestamp
      // Esegui un loop su originalLtpNames
      step3DataArray.forEach((step3Data, index) => {
        // Puoi accedere a ciascun originalLtpName all'interno del loop
        console.log('OriginalLtpName ${index}:' + step3Data['own-mac-address']);
        const entry = createMacAddressEntry(
          mountName,
          step3Data['own-mac-address'],
          step3Data['egress-ltp'],
          step3Data['original-ltp-name'],
          step3Data['vlan-id'],
          step3Data['mac-address'],
          "2010-11-20T14:00:00+01:00");
        macAddressArray.push(entry);
      });

      const macAddressData = createMacAddressData("mac-address", macAddressArray);

      const writingResultPromise = await PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(macAddressData, user, originator, xCorrelator, traceIndicator, customerJourney);

      var examples = {};
      examples['application/json'] = {
        "request-id": "305251234-101120-1414"
      };

      return (examples['application/json']);

    }
  }
  catch (error) {
    console.error('Errore durante la richiesta:', error);
    throw error;
  }
}




