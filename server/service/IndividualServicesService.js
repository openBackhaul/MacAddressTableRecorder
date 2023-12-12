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
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const TcpClient = require('../service/TcpClientService');
const createHttpError = require("http-errors");
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
exports.bequeathYourDataAndDie = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    resolve();
  });
}

function transformData(inputData) {
  const outputData = {
    "target-mac-address": `${inputData["remote-mac-address"]}`,
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

    try {
      let result = await client.get({
        index: '6',
        id: 'mount-name-list'
      });

      let mergedArray = [];

      mountList = result.body._source;

      var response = {};
      response['application/json'] = {
        'mount-name-list': mountList['mount-name-list']
      };

      if (Object.keys(response).length > 0) {
        resolve(response['application/json']);
      } else {
        resolve(null);
      }

    } catch (error) {
      reject(error);
    }

  });
};



const RequestForWriteListConnectedEquipmentIntoElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {
    try {
      //let indexAlias = await getIndexAliasAsync();
      let client = await elasticsearchService.getClient(false);

      let result = await client.index({
        index: 6,
        id: 'mount-name-list',
        body: body
      });


      if (Object.keys(result).length > 0) {
        resolve(result);
      } else {
        resolve();
      }
    }
    catch (error) {
      reject(error)
    }
  });
};


const RequestForDeleteEquipmentIntoElasticSearch = async function (mountName) {
  return new Promise(async function (resolve, reject) {
    try {
      //let indexAlias = await getIndexAliasAsync();
      let client = await elasticsearchService.getClient(false);

      let result = await client.delete({
        index: 6,
        id: mountName
      });

      if (Object.keys(result).length > 0) {
        resolve(result);
      } else {
        resolve(null);
      }
      console.log('Remove mountName={' + mountName + '}');
    }
    catch (error) {
      console.error('Failed to remove mountName={' + mountName + '}');
      reject(error)
    }
  });
};



const findNotConnectedElements = async function (listJsonES, listJsonMD) {
  return new Promise(async function (resolve, reject) {
    let listES;
    let listMD;

    try {
      if (listJsonES == null)
        resolve(null);
      else {
        listES = listJsonES["mount-name-list"];
        if (listJsonMD != null) {
          listMD = listJsonMD["mount-name-list"];

          // Filter the elements present in listES but not in listMD
          let missingElements = listES.filter(element => !listMD.includes(element));

          if (missingElements.length > 0) {
            // Create a new JSON object with the result
            const resultJSON = {
              "mount-name-list": missingElements
            };
            resolve(resultJSON);
          }
          else {
            resolve(null);
          }
        }
      }
    }
    catch (error) {
      reject(error)
    }
  });
}

function areEqualArray(listJsonES, listJsonMD) {
  let array1 = null;
  let array2 = null;

  if (listJsonES != null && listJsonES != undefined) {
    array1 = listJsonES["mount-name-list"];
  }

  if (listJsonMD != null && listJsonMD != undefined) {
    array2 = listJsonMD["mount-name-list"];
  }

  if ((array1 != null) && (array2 != null)) {

    if (array1.length !== array2.length) {
      return false;
    }

    const arraySorted1 = array1.slice().sort();
    const arraySorted2 = array2.slice().sort();

    for (let i = 0; i < arraySorted1.length; i++) {
      if (arraySorted1[i] !== arraySorted2[i]) {
        return false;
      }
    }
  }
  else {
    if (((array1 != null) && (array2 == null)) ||
      ((array1 == null) && (array2 != null))) {
      return false;
    }
  }

  return true;
}

exports.updateCurrentConnectedEquipment = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  let result;
  let listDisconnectedEq = [];
  let oldConnectedListFromES = null;
  let newConnectedListFromMwdi = null;
  let listJsonDisconnectedEq = [];
  return new Promise(async function (resolve, reject) {
    try {
      //"mount-name-list" from ES
      try {
        oldConnectedListFromES = await RequestForListOfConnectedEquipmentFromElasticSearch();
      }
      catch (error) {
        oldConnectedListFromES = null;
        console.error('mount-name-list is not present. Elastic Search error');
      }

      try {
        //MIDW applicationInfo
        let MIDWApplicationInfo = await EmbeddingCausesRequestForListOfApplicationsAtRo(user, originator, xCorrelator, traceIndicator, customerJourney);
      }
      catch (error) {
        console.error('MIDW application is not registered. Skypping');
      }

      try {
        //mountName - list from network/Mwdi
        newConnectedListFromMwdi = await EmbeddingCausesRequestForListOfDevicesAtMwdi(user, originator, xCorrelator, traceIndicator, customerJourney);
      }
      catch (error) {
        console.error('No Equipment connected. Retry to read...');
        newConnectedListFromMwdi = null;
      }

      if (newConnectedListFromMwdi != null) {
        try {
          //list of equipment that was connected (mac-address data in ES) but now that are not connected
          listJsonDisconnectedEq = await findNotConnectedElements(oldConnectedListFromES, newConnectedListFromMwdi);
        }
        catch (error) {
          listJsonDisconnectedEq = null;
          console.error('No Equipment disconnected');
        }


        //Write new "mount-name-list" list into ES
        if (areEqualArray(oldConnectedListFromES, newConnectedListFromMwdi) == false) {
          try {
            result = await RequestForWriteListConnectedEquipmentIntoElasticSearch(newConnectedListFromMwdi);
          }
          catch (error) {
            console.error('Error during updating operation of mount-name-list into db');
          }
        }

        if (listJsonDisconnectedEq != null) {
          listDisconnectedEq = listJsonDisconnectedEq["mount-name-list"];
          console.log("Number of disconnected equipment:" + listDisconnectedEq.length + "=> remove mac-adress data from ES");

          //remove mac-address data in ES of equipment that are that are no longer connected  
          try {
            if (Array.isArray(listDisconnectedEq)) {
              for (const elementToRemove of listDisconnectedEq) {
                try{
                  RequestForDeleteEquipmentIntoElasticSearch(elementToRemove);
                }
                catch(error)
                {
                  console.error('Error during deleting operation of old mac address data into db (' + elementToRemove +')');
                }
              }
            }
          }
          catch (error) {
            console.error('Error during deleting operation of old mac address data into db');
          }
        }
      }
      resolve(newConnectedListFromMwdi);

    }
    catch (error) {
      reject(error);
    }
  });
}



const EmbeddingCausesRequestForListOfApplicationsAtRo = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {

      let auth = "Basic YWRtaW46YWRtaW4=";
      let applicationNameAndHttpClient =
        await resolveApplicationNameAndHttpClientLtpUuidFromForwardingName('EmbeddingCausesRequestForListOfApplicationsAtRo');

      let operationNameAndOperationKey =
        await resolveOperationNameAndOperationKeyFromForwardingName('EmbeddingCausesRequestForListOfApplicationsAtRo');

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

      let httpRequestHeader = new RequestHeader(
        user,
        originator,
        xCorrelator,
        traceIndicator,
        customerJourney,
        operationKey
      );

      if (operationKey != "Operation key not yet provided.")
        auth = httpRequestHeader['operationKey'];

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

      //empty body
      let body = {
        "input":
          {}
      };

      try {
        let response = await axios.post(finalUrl, body, {
          headers: httpRequestHeaderAuth
        });

        const result = response.data
          .filter(item => item['application-name'] === 'MicroWaveDeviceInventory')
          .map(item => ({ port: item.port, ipAddress: item.address['ip-address']['ipv-4-address'] }));

        //check if MIDW is present
        if (result != null)
          resolve(result);
        else
          resolve(null);

      } catch (error) {
        reject(error);
      }

    } catch (error) {
      reject(error);
    }
  });
}



const EmbeddingCausesRequestForListOfDevicesAtMwdi = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let auth = "Basic YWRtaW46YWRtaW4=";
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


      let httpRequestHeader = new RequestHeader(
        user,
        originator,
        xCorrelator,
        traceIndicator,
        customerJourney,
        operationKey
      );

      if (operationKey != "Operation key not yet provided.")
        auth = httpRequestHeader['operationKey']; //#issue171


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
      let body = {
        "input":
          {}
      };

      try {
        let response = await axios.post(finalUrl, body, {
          headers: httpRequestHeaderAuth
        });

        console.log("Number of connected devices = " + response.data['mount-name-list'].length);
        resolve(response.data);
      } catch (error) {
        reject(error);
      }

    } catch (error) {
      reject(error);
    }
  });
};





const RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);

    try {
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
    } catch (error) {
      reject(error);
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
        if (error.name == 'TimeoutError') {
          const requestTimeout = createHttpError.RequestTimeout('Elastic Search error: ' + error.message);
          reject(requestTimeout);
        }
        else {
          const notFoundError = createHttpError.InternalServerError('Elastic Search error: ' + error.message);
          reject(notFoundError);
        }
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

    try {
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
          element["time-stamp-of-data"] = formatTimestamp(element["time-stamp-of-data"]);
          response['application/json'].push(element);
        }
      }

      if (Object.keys(response).length > 0) {
        resolve(response['application/json']);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
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
        if (error.name == 'TimeoutError') {
          const requestTimeout = createHttpError.RequestTimeout('Elastic Search error: ' + error.message);
          reject(requestTimeout);
        }
        else {
          const notFoundError = createHttpError.InternalServerError('Elastic Search error: ' + error.message);
          reject(notFoundError);
        }
      });
  });
};


function formatTimestamp(timestamp) {
  if (isNaN(timestamp) || timestamp < 0 || timestamp > 9999999999999) {
    return "Invalid Timestamp";
  }

  const date = new Date(timestamp);
  return date.toISOString();
}

const PromptForProvidingSpecificMacTableCausesReadingFromElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);

    try {
      let mountName = body['mount-name'];

      let res2 = await client.get({
        index: '6',
        id: mountName
      });

      var source = res2.body._source['mac-address'];

      const formattedEntries = source.map(entry => {
        return {
          ...entry,
          "time-stamp-of-data": formatTimestamp(entry["time-stamp-of-data"])
        };
      });

      var response = {};
      response['application/json'] = {
        'mac-address': formattedEntries
      };


      if (Object.keys(response).length > 0) {
        resolve(response['application/json']['mac-address']);
      } else {
        resolve(null); // Resolve the promise with null if necessary
      }
    } catch (error) {
      reject(error);
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
        resolve(response);
      })
      .catch(function (error) {
        if (error.name == 'TimeoutError') {
          const requestTimeout = createHttpError.RequestTimeout('Elastic Search error: ' + error.message);
          reject(requestTimeout);
        }
        else {
          const notFoundError = createHttpError.InternalServerError('Elastic Search error: ' + error.message);
          reject(notFoundError);
        }
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
    }

    let newBaseUrl = baseUrl.replace("{mount-name}", mountName);

    const encodedFields = customEncode(fields);
    const fullUrl = newBaseUrl + 'fields=' + encodedFields;

    try {
      let response = await axios.get(fullUrl, {
        headers: httpRequestHeader
      });

      if (response.status === 200) {
        console.log("STEP1(" + mountName + "): " + newBaseUrl + 'fields=' + fields);
        return (response.data);
      }
      else {
        throw {
          statusCode: response.status,
          message: response.statusText
        };
      }
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
    let auth = "Basic YWRtaW46YWRtaW4=";
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

    if (operationKey != "Operation key not yet provided.")
      auth = httpRequestHeader['operationKey']; //#issue171

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
      console.log("STEP2(" + mountName + "): " + fullUrl);
      return response.data;
    } catch (error) {
      throw error;
    }

  } catch (error) {
    throw error;
  }
}


//STEP 3
async function PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(mountName, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let additionaResponse = {};
  try {

    if (body == "LTP-MNGT") {
      console.log("STEP3(" + mountName + ") = LAN-MNGT");
      return "LAN-MNGT";
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

    let uuid = mountName + "+" + body;

    let finalUrlTmp = finalUrl.replace("{mount-name}", mountName);
    finalUrl = finalUrlTmp.replace("{uuid}", uuid);

    let splitUrl = finalUrl.split('fields=');

    let fields = "";
    let baseUrl = "";

    if (splitUrl.length > 1) {
      baseUrl = splitUrl[0];
      fields = splitUrl[1];
    }

    const encodedFields = customEncode(fields);
    const finalUrlEncoded = baseUrl + 'fields=' + encodedFields;

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
      let response = await axios.get(finalUrlEncoded, {
        headers: httpRequestHeader
      });

      let data = response.data['ltp-augment-1-0:ltp-augment-pac']['original-ltp-name'];

      if (data !== null && data !== undefined) {
        additionaResponse = {
          'egress-ltp': body,
          'original-ltp-name': data
        };
      }
      else {
        additionaResponse = {
          'egress-ltp': body,
          'original-ltp-name': "undefined"
        };
      }

      console.log("STEP3(" + mountName + "): " + finalUrl);
      return (additionaResponse);
    } catch (error) {
      additionaResponse = {
        'egress-ltp': body,
        'original-ltp-name': "undefined"
      };
      throw error;
    }
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

      if (response.status === 200)
        return (response.data);
      else {
        throw {
          statusCode: response.status,
          message: response.statusText
        };
      }

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


function getOriginalLtpName(jsonArray, egressLtp) {
  for (let entry of jsonArray) {
    if (entry['egress-ltp'] === egressLtp) {
      return entry['original-ltp-name'];
    }
  }

  return "Undefined";
}

async function sentDataToRequestor(body, user, originator, xCorrelator, traceIndicator, customerJourney, requestorUrl) {
  let httpRequestHeaderRequestor;

  //TO FIX
  let operationKey = 'Operation key not yet provided.'

  let httpRequestHeader = new RequestHeader(
    user,
    originator,
    xCorrelator,
    traceIndicator,
    customerJourney,
    operationKey
  );

  httpRequestHeaderRequestor = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
  console.log('Send data to Requestor:' + requestorUrl);

  try {
    let response = await axios.post(requestorUrl, body, {
      headers: httpRequestHeaderRequestor
    });
    return true;
  }
  catch (error) {
    return (null);
  }
}

function generateRequestId(mountName) {
  return mountName + "-" + Date.now().toString();
}

function getRequestorPath(body) {
  let requestorAddress;
  let requestorPort;
  let requestorService;
  let requestorUrl;

  try {
    requestorAddress = body['requestor-address']['ip-address']['ipv-4-address'];
    if (requestorAddress != null && requestorAddress != undefined) {
      requestorPort = body['requestor-port'];
      if (requestorPort != undefined && requestorPort != null) {
        requestorService = body['requestor-receive-operation'];
        if (requestorService != null)
          requestorUrl = "http://" + requestorAddress + ":" + requestorPort + requestorService;
        return requestorUrl;
      }
    }
  }
  catch (error) {
    return null;
  }

  return null;
}

exports.readCurrentMacTableFromDevice = async function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  const FDomainArray = [];
  let step2DataArray = [];
  let step3DataArray = [];
  let macAddressArray = [];
  let eggressUniqArray = [];
  let bodyRequestor = {};
  let urlRequestor;
  let resRequestor = null;

  return new Promise(async function (resolve, reject) {


    var result = {};

    const mountName = body['mount-name'];

    let reqId = generateRequestId(mountName);

    bodyRequestor['application/json'] = {
      "request-id": "{" + reqId + "}"
    };

    urlRequestor = getRequestorPath(body);
    if (urlRequestor != null) {
      resRequestor = await sentDataToRequestor(bodyRequestor, user, originator, xCorrelator, traceIndicator, customerJourney, urlRequestor);
      if (resRequestor == null)
        throw "Failed send data to requestor";
    }

    try {
      //STEP1
      //"/core-model-1-4:network-control-domain=cache/control-construct={mount-name}?fields=forwarding-domain(uuid;layer-protocol-name;mac-fd-1-0:mac-fd-pac(mac-fd-status(mac-address-cur)))",
      try {

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


      } catch (error) {
        console.error('STEP1(' + mountName + '):' + error.message);
        throw (error.message + '(STEP1)');
      }


      //STEP2
      //"/rests/operations/network-topology:network-topology/topology=topology-netconf/node={mount-name}/yang-ext:mount/mac-fd-1-0:provide-learned-mac-addresses" 
      if (FDomainArray.length > 0) {
        try {
          const dataFromRequest = await PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney);

          let uuid = FDomainArray[0]['uuid'];
          let macAddressCur = FDomainArray[0]['mac-fd-1-0:mac-fd-pac']['mac-fd-status']['mac-address-cur'];

          const step2Data = new Set();
          let egressData = [];
          dataFromRequest["mac-fd-1-0:output"]["mac-table-entry-list"].forEach(entry => {
            if (entry["affected-mac-fd"] === uuid) {
              entry["own-mac-address"] = macAddressCur;
              step2Data.add(entry);
            }
          });

          step2DataArray = Array.from(step2Data);

          const eggressUniqSet = new Set();
          // Iterare sugli oggetti nell'array e aggiungere i cognomi al Set
          step2DataArray.forEach(obj => {
            eggressUniqSet.add(obj['egress-ltp']);
          });

          // Convertire il Set in un array
          eggressUniqArray = [...eggressUniqSet];
        }
        catch (error) {
          console.error('STEP2(' + mountName + '):' + error.message);
          throw (error.message + '(STEP2)');
        }

        //STEP3
        try {
          const originalLtpNamePromises = eggressUniqArray.map(egressData => {
            return PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(mountName, egressData, user, originator, xCorrelator, traceIndicator, customerJourney);
          });
          step3DataArray = await Promise.all(originalLtpNamePromises);
        } catch (error) {
          console.error('STEP3(' + mountName + '):' + error);
          throw (error.message + '(STEP3)');
        }

        // Get the current timestamp in milliseconds
        const timestamp = new Date().getTime();


        step2DataArray.forEach((step2Data, index) => {
          const entry = createMacAddressEntry(
            mountName,
            step2Data['own-mac-address'],
            step2Data['egress-ltp'],
            getOriginalLtpName(step3DataArray, step2Data['egress-ltp']),
            step2Data['vlan-id'],
            step2Data['mac-address'],
            timestamp);
          macAddressArray.push(entry);
        });

        const macAddressData = createMacAddressData("mac-address", macAddressArray);

        //STEP4
        try {
          const writingResultPromise = await PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(macAddressData, user, originator, xCorrelator, traceIndicator, customerJourney);
        }
        catch (error) {
          console.error('STEP4(' + mountName + '):' + error.message);
          throw (error.message + '(STEP4)');
        }
        console.log('STEP4(' + mountName + ')');

        result['application/json'] = {
          "request-id": reqId
        };

        if (urlRequestor != null) {
          bodyRequestor['application/json'] = {
            "request-id": "{" + reqId + "}",
            macAddressData
          };
          resRequestor = await sentDataToRequestor(bodyRequestor, user, originator, xCorrelator, traceIndicator, customerJourney, urlRequestor);
          if (resRequestor == null) {
            throw "Failed send data to requestor";
          }
        }
        resolve(result['application/json']);
      }
    }
    catch (error) {
      const internalServerError = createHttpError.InternalServerError('readCurrentMacTableFromDevice ' + error);
      reject(internalServerError);
    }
  });

}





