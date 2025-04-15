'use strict';

// ONF Libs
var appCommons = require('onf-core-model-ap/applicationPattern/commons/AppCommons');  // TODO: To be check
const { getIndexAliasAsync, elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');
const tcpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface');
const ForwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const FcPort = require('onf-core-model-ap/applicationPattern/onfModel/models/FcPort');
const httpClientInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpClientInterface');
const httpServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/HttpServerInterface');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');
const LayerProtocol = require('onf-core-model-ap/applicationPattern/onfModel/models/LayerProtocol');
const onfAttributeFormatter = require('onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter');
const RequestHeader = require('onf-core-model-ap/applicationPattern/rest/client/RequestHeader');
var responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const genericRepresentation = require('onf-core-model-ap-bs/basicServices/GenericRepresentation');

// Other Libs
const createHttpError = require("http-errors");
const axios = require('axios');

// Internal routines
const LogicalTerminationPointC = require('./custom/LogicalTerminationPointC');
const authKey = require("../application-data/encrypted-odl-key.json");
const logger = require('../service/LoggingService.js').getLogger();

// ------------- Constants
const FWD_DOMAIN = "forwarding-domain";
const CTRL_CONSTR = "core-model-1-4:control-construct";
const MAC_ADDR = "mac-address";
const MAC_OUTPUT = "mac-fd-1-0:output";
const OWN_MAC = "own-mac-address";
const REMOTE_MAC = "remote-mac-address"
const MAC_ENTRY_LIST = "mac-table-entry-list";

const MOUNT_NAME = "mount-name";
const MOUNT_NAME_LIST = "mount-name-list";

const EGRESS_LTP = "egress-ltp";
const EGRESS_LTP_UUID = "egress-ltp-uuid";
const ORIG_LTP_NAME = "original-ltp-name";

const VLAN_ID = "vlan-id";
const T_STAMP = "time-stamp-of-data";
// -----------------------------------

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
    "target-mac-address": `${inputData[REMOTE_MAC]}`,
    "mount-name": inputData[MOUNT_NAME],
    "original-ltp-name": inputData[ORIG_LTP_NAME],
    "egress-ltp-uuid": inputData[EGRESS_LTP_UUID],
    "vlan-id": inputData[VLAN_ID],
    "time-stamp-of-data": new Date(inputData[T_STAMP]).toISOString()
  };
  return outputData;
}



const RequestForListOfConnectedEquipmentFromElasticSearch = async function () {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);
    let mountList;

    let indexAlias = await getIndexAliasAsync();

    try {
      let result = await client.get({
        index: indexAlias,
        id: MOUNT_NAME_LIST
      });

      let mergedArray = [];

      mountList = result.body._source;

      var response = {};
      response['application/json'] = {
        'mount-name-list': mountList[MOUNT_NAME_LIST]
      };

      if (Object.keys(response).length > 0) {
        resolve(response['application/json']);
      } else {
        resolve(null);
      }

    } catch (error) {
      resolve(null);
    }

  });
};



const RequestForWriteListConnectedEquipmentIntoElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {
    try {

      let client = await elasticsearchService.getClient(false);

      let indexAlias = await getIndexAliasAsync();

      let result = await client.index({
        index: indexAlias,
        id: MOUNT_NAME_LIST,
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
      let client = await elasticsearchService.getClient(false);

      let indexAlias = await getIndexAliasAsync();

      let result = await client.delete({
        index: indexAlias,
        id: mountName
      });

      if (Object.keys(result).length > 0) {
        resolve(result);
      } else {
        resolve(null);
      }
      logger.info("Remove mount-name = "+ mountName);
    }
    catch (error) {
      reject(error);
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
        listES = listJsonES[MOUNT_NAME_LIST];
        if (listJsonMD != null) {
          listMD = listJsonMD[MOUNT_NAME_LIST];

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
    array1 = listJsonES[MOUNT_NAME_LIST];
  }

  if (listJsonMD != null && listJsonMD != undefined) {
    array2 = listJsonMD[MOUNT_NAME_LIST];
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

function waitAsync(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeAfterWait() {
  try {
    // Wait 300 seconds
    await waitAsync(30000);
  } catch (error) {
    logger.error(error, 'An error occurred during the wait:');
  }
}

exports.updateCurrentConnectedEquipment = async function (user, originator, xCorrelator, traceIndicator, customerJourney) {
  let result;
  let listDisconnectedEq = [];
  let oldConnectedListFromES = null;
  let newConnectedListFromMwdi = null;
  let listJsonDisconnectedEq = [];


  function printArray(array, alphabetical = false) {
    // Create a copy of the array to sort if alphabetical is true
    let outputArray = alphabetical ? [...array].sort() : array;

    // Join the elements with a comma and a space
    let result = outputArray.join(", ");
    logger.info(result);
  }

  const refreshIndex = async () => {
    try {
      let client = await elasticsearchService.getClient(false);
      let indexAlias = await getIndexAliasAsync();
      let result = await client.indices.refresh({ index: indexAlias });
      logger.info(`Index ${indexAlias} refreshed successfully`);
    } catch (error) {
      logger.error(error, `Error refreshing index ${indexAlias}:`);
    }
  };


  return new Promise(async function (resolve, reject) {
    try {

      await refreshIndex();

      //"mount-name-list" from ES
      try {
        oldConnectedListFromES = await RequestForListOfConnectedEquipmentFromElasticSearch();
        logger.info("mount-name-list (ES), number of elements:" + oldConnectedListFromES[MOUNT_NAME_LIST].length);
      }
      catch (error) {
        logger.error("mount-name-list is not present (elastic search error)");
      }

      try {
        //MIDW applicationInfo
        let MIDWApplicationInfo = await EmbeddingCausesRequestForListOfApplicationsAtRo(user, originator, xCorrelator, traceIndicator, customerJourney);
      }
      catch (error) {
        //console.log('MIDW application is not registered. Skypping');
      }

      try {
        //mountName - list from network/Mwdi
        newConnectedListFromMwdi = await EmbeddingCausesRequestForListOfDevicesAtMwdi(user, originator, xCorrelator, traceIndicator, customerJourney);

        if ((newConnectedListFromMwdi != null) && (newConnectedListFromMwdi.length == 0)) {
          logger.warn('No Equipment connected. Wait 30 seconds and retry to read...');
          await executeAfterWait();
        }
        else {
          logger.info("mount-name-list (MWDI), number of elements:" + newConnectedListFromMwdi[MOUNT_NAME_LIST].length);
        }
      }
      catch (error) {
        logger.error(error, ', wait 30 seconds and retry to read...');
        await executeAfterWait();
        newConnectedListFromMwdi = null;
      }

      if (newConnectedListFromMwdi != null) {
        try {
          //list of equipment that was connected (mac-address data in ES) but now that are not connected
          listJsonDisconnectedEq = await findNotConnectedElements(oldConnectedListFromES, newConnectedListFromMwdi);
          if (listJsonDisconnectedEq != null) {
            logger.info("list of equipments disconnected, number of elements:  -" + listJsonDisconnectedEq[MOUNT_NAME_LIST].length + " => remove mac-address data from ES");
            //printArray(listJsonDisconnectedEq[MOUNT_NAME_LIST]);
          }
          else {
            logger.info("list of equipments disconnected, number of elements:" + 0);
          }
        }
        catch (error) {
          listJsonDisconnectedEq = null;
          logger.info('No Equipment disconnected');
        }

        //Write new "mount-name-list" list into ES
        printArray(newConnectedListFromMwdi[MOUNT_NAME_LIST]);
        if (areEqualArray(oldConnectedListFromES, newConnectedListFromMwdi) == false) {
          try {
            result = await RequestForWriteListConnectedEquipmentIntoElasticSearch(newConnectedListFromMwdi);
            logger.info("Write new mount-name-list into ES, number of elements:" + newConnectedListFromMwdi[MOUNT_NAME_LIST].length);
          }
          catch (error) {
            logger.info('mount-name-list are not updated, no difference between old ES mount-name-list and MWDI mount-name-list currently read');
          }
        }
        else {
          logger.info("Write new mount-name-list, number of elements:" + newConnectedListFromMwdi[MOUNT_NAME_LIST].length);
        }

        if (listJsonDisconnectedEq != null) {
          listDisconnectedEq = listJsonDisconnectedEq[MOUNT_NAME_LIST];

          //remove mac-address data in ES of equipment that are that are no longer connected  
          try {
            if (Array.isArray(listDisconnectedEq)) {
              for (const elementToRemove of listDisconnectedEq) {
                try {
                  await RequestForDeleteEquipmentIntoElasticSearch(elementToRemove);
                }
                catch (error) {
                  logger.error('Error during remove operation of old mac address data into db (' + elementToRemove + ')');
                }
              }
            }
          }
          catch (error) {
            logger.error('Error during remove operation of old mac address data into db');
          }
        }
      }
      await refreshIndex();
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
      logger.info("url = " + finalUrl);

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
        "operation-key": httpRequestHeader['operationKey']
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
      logger.info("url = " + finalUrl);

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
      };

      httpRequestHeader = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeaderAuth);

      try {
        let response = await axios.post(finalUrl, {}, {
          headers: httpRequestHeaderAuth
        });

        resolve(response.data);
      } catch (error) {
        reject(error);
      }

    } catch (error) {
      reject(error);
    }
  });
};


function generateMountAndEgressPairs(data) {
  const formattedArray = [];

  const mounts = {};

  data[0].forEach(entry => {
    const mountname = entry[MOUNT_NAME];
    const egressltpuuid = entry[EGRESS_LTP_UUID];
    if (mounts[mountname]) {
      mounts[mountname].push(egressltpuuid);
    } else {
      mounts[mountname] = [egressltpuuid];
    }
  });

  for (const [mount, egresses] of Object.entries(mounts)) {
    formattedArray.push(`${mount}:${egresses.join(':')}`);
  }

  return formattedArray;
}



const RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch = async function (body) {
  return new Promise(async function (resolve, reject) {

    let transformedArray = null;
    let result = null;
    let resultString = null;


    let client = await elasticsearchService.getClient(false);

    try {
      let targetMacAddress = body['target-mac-address'];

      let indexAlias = await getIndexAliasAsync();

      let res2 = await client.search({
        index: indexAlias,
        _source: MAC_ADDR,
        body: {
          query: {
            match: {
              'mac-address.remote-mac-address': targetMacAddress
            }
          }
        }
      });

      let mergedArray = [];

      const hits = res2.body.hits.hits;
      for (const hit of hits) {
        const source = hit._source[MAC_ADDR];
        mergedArray = mergedArray.concat(source);
      }

      const filteredObjects = mergedArray.filter(obj =>
        obj[REMOTE_MAC].toLowerCase() === targetMacAddress.toLowerCase()
      );

      transformedArray = filteredObjects.map(obj => transformData(obj));

      if (transformedArray != null) {
        let response = {};
        response['application/json'] = {
          'targetMacAddress': transformedArray
        };

        if (Object.keys(response).length > 0) {
          resolve(response['application/json']['targetMacAddress']);
        } else {
          resolve();
        }
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
exports.provideListOfNetworkElementInterfacesOnPath = async function (body, url) {
  return new Promise(function (resolve, reject) {
    RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch(body)
      .then(function (response) {
        let newArray = JSON.parse(JSON.stringify(response));

        // Remove the key "egress-ltp-uuid"
        newArray.forEach(obj => {
          delete obj[EGRESS_LTP_UUID];
        });

        resolve(newArray);
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
exports.provideListOfNetworkElementInterfacesOnPathInGenericRepresentation = async function (body, req) {
  return new Promise(async function (resolve, reject) {
    const inputValueList = body["input-value-list"];
    let fieldValues;
    let fieldValueFinal = [];
    let result = [];
    let arrayMountNameInterface = [];

    let operationServerName = req;

    if (inputValueList && inputValueList.length > 0) {
      // Build an array with "field-value" values
      fieldValues = inputValueList.map(item => item["field-value"]);
    }

    for (const inputValue of body["input-value-list"]) {
      // Extract "field-value" frpm input value
      const fieldValue = inputValue["field-value"];

      // Pushing data in return array
      fieldValueFinal.push({
        "target-mac-address": fieldValue
      });
    }

    let startTime = process.hrtime();
    let responseCode = responseCodeEnum.code.OK;
    let responseBodyToDocument = {};

    let consequentActionList = await genericRepresentation.getConsequentActionList(operationServerName);
    let responseValueList = await genericRepresentation.getResponseValueList(operationServerName);


    const promises = fieldValueFinal.map(fieldValue => {
      return RequestForListOfNetworkElementInterfacesOnPathCausesReadingFromElasticSearch(fieldValue)
        .then(
          response => response
        )
        .catch(error => {
          if (error.name == 'TimeoutError') {
            const requestTimeout = createHttpError.RequestTimeout('Elastic Search error: ' + error.message);
            throw requestTimeout;
          } else {
            const notFoundError = createHttpError.InternalServerError('Elastic Search error: ' + error.message);
            throw notFoundError;
          }
        });
    });

    Promise.all(promises)
      .then(response => {
        const arrayMountNameInterface = generateMountAndEgressPairs(response);

        arrayMountNameInterface.forEach(entry => {
          result.push({
            "value": entry,
            "datatype": "string",
            "field-name": responseValueList[0]["fieldName"]
          });
        });


        let fullResponse =
        {
          "consequent-action-list": consequentActionList,
          "response-value-list": result
        }

        resolve(fullResponse);
      })
      .catch(error => {
        logger.error(error);
      });
  });
}

function orderData(input) {

  const output = {
    "mount-name": input[MOUNT_NAME],
    "own-mac-address": input[OWN_MAC],
    "egress-ltp-uuid": input[EGRESS_LTP_UUID],
    "original-ltp-name": input[ORIG_LTP_NAME],
    "vlan-id": input[VLAN_ID],
    "remote-mac-address": input[REMOTE_MAC],
    "time-stamp-of-data": input[T_STAMP]
  };

  return output;
}


const PromptForProvidingAllMacTablesCausesReadingFromElasticSearch = async function () {
  return new Promise(async function (resolve, reject) {
    let client = await elasticsearchService.getClient(false);
    let indexAlias = await getIndexAliasAsync();
    const response = { 'application/json': [] };

    try {
      // Inizialize scroll operation
      let res2 = await client.search({
        index: indexAlias,
        _source: MAC_ADDR,
        scroll: '1m',  // Keep window scroll opened for 1 minute
        body: {
          query: {
            match: {
              'datatype': MAC_ADDR
            }
          }
        }
      });

      let scrollId = res2.body._scroll_id;
      let hits = res2.body.hits.hits;

      // Continue to retrieve as long as there are documents.
      while (hits.length > 0) {
        for (const hit of hits) {
          const source = hit._source[MAC_ADDR];

          for (const element of source) {
            element[T_STAMP] = formatTimestamp(element[T_STAMP]);
            response['application/json'].push(element);
          }
        }

        // Next scroll request
        res2 = await client.scroll({
          scroll_id: scrollId,
          scroll: '1m'
        });

        scrollId = res2.body._scroll_id;
        hits = res2.body.hits.hits;
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
    let res2;
    var response = { 'application/json': [] };

    let indexAlias = await getIndexAliasAsync();

    try {
      let mountName = body[MOUNT_NAME];

      res2 = await client.get({
        index: indexAlias,
        id: mountName
      });

      let source = res2.body._source[MAC_ADDR];

      if (source) {
        const formattedEntries = source.map(entry => {
          return {
            ...entry,
            "time-stamp-of-data": formatTimestamp(entry[T_STAMP])
          };
        });
  
        let response = {};
        response['application/json'] = {
          'mac-address': formattedEntries
        };
  
  
        if (Object.keys(response).length > 0) {
          resolve(response['application/json'][MAC_ADDR]);
        } else {
          logger.error("No data found in ElasticSearch! - Mountname: " + mountName)
          throw new Error("No data found in ElasticSearch!");
        }
      } else {
        logger.error("No MAC Address data found in ElasticSearch! - Mountname: " + mountName)
        throw new Error("No MAC Address data found in ElasticSearch!");
      }

    } catch (error) {
      logger.error(error);
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
    return userName;
  } catch (error) {
    logger.error(`Could not decode authorization code "${authorizationCode}". Got ${error}.`);
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

    let response;

    response = await axios.get(fullUrl, {
      headers: httpRequestHeader
    });

    if (response.status === 200) {
      logger.debug("OK - Get data from MWDI -  mountname: " + mountName);
      return (response.data);
    }
    else {
      let err = new Error("Empty data from " + fullUrl, { cause: 204 } );
      throw err;
    }
  } catch (error) {
    throw error;
  }
}

//STEP 2
async function PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let auth = authKey['api-key'];  //read from external file
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

    let data = {
      "input":
        {}
    };

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

    let response = await axios.post(fullUrl, data, {
      headers: httpRequestHeaderAuth
    });

    if (response.data == '') {
      logger.warn("Get empty data from ODL - mountname: " + mountName);
      let err = new Error("Empty data from ODL: " + mountName, { cause: 204 } );
      throw err;
    }
    else {
      logger.info("Get data from ODL - mountname: " + mountName);
      return response.data;
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

      let data = response.data['ltp-augment-1-0:ltp-augment-pac'][ORIG_LTP_NAME];

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

      return (additionaResponse);
    } catch (error) {
      if (error.response.status == 400) {
        additionaResponse = {
          'egress-ltp': body,
          'original-ltp-name': "undefined"
        };
        return additionaResponse;
      } else {
        throw error;
      }
    }
  } catch (error) {
    throw error;
  }
}


//STEP4
async function PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  try {
    let mountName = undefined;
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


    if (body && body[MAC_ADDR] && Array.isArray(body[MAC_ADDR]) && body[MAC_ADDR].length > 0 && body[MAC_ADDR][0][MOUNT_NAME]) {
      mountName = body[MAC_ADDR][0][MOUNT_NAME];
    } else {
      logger.error('********************************* Body *******************************************');
      logger.error(body);
      logger.error('**********************************************************************************');
      throw new Error("Writing operation into Elastic Search Failed : body structure is not correct");
    }

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
      if (/^20[0-9]$/.test(response.status.toString()))   //bug @216
      {
        logger.info("Writing (" + mountName + ") data into Elastic Search ");
        return (response.data);
      }
      else {
        logger.error("Writing operation into Elastic Search Failed (" + mountName + ")");
        let err = new Error("Writing operation into Elastic Search Failed (" + mountName + ")", { cause: 204 } );
        throw err;
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

function createMacAddressDataForDb(datatype, macAddressArray) {
  return {
    "datatype": datatype,
    "mac-address": macAddressArray
  };
}


function getOriginalLtpName(jsonArray, egressLtp) {
  for (let entry of jsonArray) {
    if (entry['egress-ltp'] === egressLtp) {
      return entry[ORIG_LTP_NAME];
    }
  }

  return "Undefined";
}

async function PromptForUpdatingMacTableFromDeviceCausesSendingAnswerToRequestor(data, user, originator, xCorrelator, traceIndicator, customerJourney, requestorUrl) {
  let httpRequestHeaderRequestor;

  // let operationNameAndOperationKey =
  //     await resolveOperationNameAndOperationKeyFromForwardingName('PromptForUpdatingMacTableFromDeviceCausesSendingAnswerToRequestor');
  
  const operationKey = "Operation key not yet provided.";
  
  let httpRequestHeader = new RequestHeader(
    user,
    originator,
    xCorrelator,
    traceIndicator,
    customerJourney,
    operationKey
  );

  httpRequestHeaderRequestor = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(httpRequestHeader);
  let result = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(data);

  logger.info('Send data to Requestor:' + requestorUrl);

  try {
    let response = await axios.post(requestorUrl, data, {
      headers: httpRequestHeaderRequestor
    });
    return true;
  } catch (error) {
    throw error;
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
    return (null);
  }

  return (null);
}


// Transforming array to be compliant with specifiction
function transformArray(reqId, inputArray) {
  let returnValue = [];
  let resultArr = [];

  // Iterate through array
  inputArray.forEach(item => {
    // Create object with requested information
    let transformedObject= {
      "mount-name": item[MOUNT_NAME],
      "own-mac-address": item[OWN_MAC],
      "egress-ltp-uuid": item[EGRESS_LTP_UUID],
      "original-ltp-name": item[ORIG_LTP_NAME],
      "vlan-id": item[VLAN_ID],
      "remote-mac-address": item[REMOTE_MAC],
      "time-stamp-of-data": new Date(item[T_STAMP]).toISOString()  // Add formatted time stamp
    };

    onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(transformedObject);
    resultArr.push(transformedObject);
  });

  returnValue.push({
    "request-id": reqId,
    "mac-address-data": resultArr
  });

  return returnValue;
}

async function readCurrentMacTableFromDeviceCallbacks(body, user, originator, xCorrelator, traceIndicator, customerJourney, reqId) {
  const FDomainArray = [];
  let step2DataArray = [];
  let step3DataArray = [];
  let macAddressArray = [];
  let eggressUniqArray = [];
  let urlRequestor;

  return new Promise(async function (resolve, reject) {

    const mountName = body[MOUNT_NAME];

    try {

      //STEP1
      //"/core-model-1-4:network-control-domain=cache/control-construct={mount-name}?fields=forwarding-domain(uuid;layer-protocol-name;mac-fd-1-0:mac-fd-pac(mac-fd-status(mac-address-cur)))",
      try {
        logger.debug("Calling PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi - mountname: " + mountName);
        const data = await PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi(mountName, user, originator, xCorrelator, traceIndicator, customerJourney);

        if (
          data &&
          data[CTRL_CONSTR] &&
          Array.isArray(data[CTRL_CONSTR]) &&
          data[CTRL_CONSTR].length > 0 &&
          data[CTRL_CONSTR][0][FWD_DOMAIN] &&
          Array.isArray(data[CTRL_CONSTR][0][FWD_DOMAIN]) &&
          data[CTRL_CONSTR][0][FWD_DOMAIN].length > 0
        ) {
          data[CTRL_CONSTR].forEach(controlConstruct => {
            controlConstruct[FWD_DOMAIN].forEach(forwardingDomain => {
              if (
                forwardingDomain["layer-protocol-name"].includes(
                  "mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER"
                )
              ) {
                FDomainArray.push(forwardingDomain);
              }
            });

          });
        }
        else {
          logger.warn("Data from MWDI is empty");
          let err = new Error("Empty data from " + fullUrl, 204);
          throw err;
        }

      } catch (error) {
        logger.error(error, "Failing calling PromptForUpdatingMacTableFromDeviceCausesUuidOfMacFdBeingSearchedAndManagementMacAddressBeingReadFromMwdi - mountname: " + mountName);
        throw error
      }

      //STEP2
      //"/rests/operations/network-topology:network-topology/topology=topology-netconf/node={mount-name}/yang-ext:mount/mac-fd-1-0:provide-learned-mac-addresses" 
      if (FDomainArray.length >= 0) {
        try {
          logger.debug("Calling PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice - mountname: " + mountName);
          const dataFromRequest = await PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice(mountName, user, originator, xCorrelator, traceIndicator, customerJourney);

          let uuid = 0;
          let macAddressCur = "00:00:00:00:00:00";

          // Not correct behavior, could be multiple Forwarding domain
          // if (FDomainArray.length > 0) {
          //   uuid = FDomainArray[0]['uuid'];
          //   macAddressCur = FDomainArray[0]['mac-fd-1-0:mac-fd-pac']['mac-fd-status']['mac-address-cur'];
          // }

          const step2Data = new Set();
          let egressData = [];

          if (
            dataFromRequest &&
            dataFromRequest[MAC_OUTPUT] &&
            dataFromRequest[MAC_OUTPUT][MAC_ENTRY_LIST] &&
            Array.isArray(dataFromRequest[MAC_OUTPUT][MAC_ENTRY_LIST])
          ) {
            dataFromRequest[MAC_OUTPUT][MAC_ENTRY_LIST].forEach(entry => {
              if (FDomainArray.length > 0) {
                FDomainArray.forEach(entryFD => {
                  uuid = entryFD["uuid"];
                  macAddressCur = entryFD['mac-fd-1-0:mac-fd-pac']['mac-fd-status']['mac-address-cur'];
                  if ((FDomainArray.length > 0) && (entry["affected-mac-fd"] === uuid)) {
                    entry[OWN_MAC] = macAddressCur;
                    step2Data.add(entry);
                  }

                });
              } else {
                entry[OWN_MAC] = macAddressCur;
                step2Data.add(entry);
              }
              // if ((FDomainArray.length > 0) && (entry["affected-mac-fd"] === uuid)) {
              //   entry[OWN_MAC] = macAddressCur;
              //   step2Data.add(entry);
              // }
              // else if (FDomainArray.length == 0) {
              //   entry[OWN_MAC] = macAddressCur;
              //   step2Data.add(entry);
              // }
            });

            if (step2Data.length == 0) {
              logger.warn("Step2Data is empty!");
              logger.warn("Forwarding domain: %d", FDomainArray);
              logger.warn("Data from request: %d", dataFromRequest)
            }
            step2DataArray = Array.from(step2Data);

            const eggressUniqSet = new Set();
            step2DataArray.forEach(obj => {
              eggressUniqSet.add(obj[EGRESS_LTP]);
            });

            // Set converted into array
            eggressUniqArray = [...eggressUniqSet];
          }
          else {
            logger.error("Received data are not correct (mac-fd-1-0:output/mac-table-entry-list)");
            let err = new Error("Empty data from ODL: " + mountName, {reason: 204});
            throw err;
          }
        }
        catch (error) {
          logger.error(error, "Failing calling PromptForUpdatingMacTableFromDeviceCausesMacTableBeingRetrievedFromDevice");
          throw error;
        }

        //STEP3
        try {
          logger.debug("Calling PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi - mountname: " + mountName);
          const originalLtpNamePromises = eggressUniqArray.map(egressData => {
            return PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi(mountName, egressData, user, originator, xCorrelator, traceIndicator, customerJourney);
          });
          step3DataArray = await Promise.all(originalLtpNamePromises);
        } catch (error) {
          logger.error(error, "Failing calling PromptForUpdatingMacTableFromDeviceCausesLtpUuidBeingTranslatedIntoLtpNameBasedOnMwdi - mountname:" + mountName);
          throw (error);
        }

        // Get the current timestamp in milliseconds
        const timestamp = new Date().getTime();


        step2DataArray.forEach((step2Data, index) => {
          const entry = createMacAddressEntry(
            mountName,
            step2Data[OWN_MAC],
            step2Data[EGRESS_LTP],
            getOriginalLtpName(step3DataArray, step2Data[EGRESS_LTP]),
            step2Data[VLAN_ID],
            step2Data[MAC_ADDR],
            timestamp);
          macAddressArray.push(entry);
        });

        const macAddressDataDb = createMacAddressDataForDb(MAC_ADDR, macAddressArray);

        //STEP4
        try {
          logger.debug("Calling PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch - mountname: " + mountName);
          const writingResultPromise = await PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch(macAddressDataDb, user, originator, xCorrelator, traceIndicator, customerJourney);
        }
        catch (error) {
          logger.error(error, "Failing calling PromptForUpdatingMacTableFromDeviceCausesWritingIntoElasticSearch");
          throw error;
        }

        // Retrieve url requestor from body
        urlRequestor = getRequestorPath(body);

        if (urlRequestor != null) {
          const transformedArray = transformArray(reqId, macAddressArray);

          try {
            await PromptForUpdatingMacTableFromDeviceCausesSendingAnswerToRequestor(transformedArray, user, originator, xCorrelator, traceIndicator, customerJourney, urlRequestor);
          } catch (error) {
            throw ("Failed send data to requestor: " + error.message);
          }
        } else {
          resolve(200);
        }
      }
      else {
        throw new Error("Missing mac-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_MAC_LAYER");
      }
    }
    catch (error) {
      reject(error)
    }
    resolve(200);
  });


}

exports.readCurrentMacTableFromDeviceInternal = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    // Start reading data
    let res = readCurrentMacTableFromDeviceCallbacks(body, user, originator, xCorrelator, traceIndicator, customerJourney, reqId);

    resolve(res);
  });
}

exports.readCurrentMacTableFromDevice = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(async function (resolve, reject) {
    const mountName = body[MOUNT_NAME];
    let reqId = generateRequestId(mountName);
    // Result that return API
    let result = {};
    result['application/json'] = {
      "request-id": reqId
    };

    // Start reading data
    readCurrentMacTableFromDeviceCallbacks(body, user, originator, xCorrelator, traceIndicator, customerJourney, reqId);

    resolve(result['application/json']);
  });
}
