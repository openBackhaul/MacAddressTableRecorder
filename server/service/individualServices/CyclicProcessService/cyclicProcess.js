'use strict';

// ONF Libs
const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const RequestHeader = require("onf-core-model-ap/applicationPattern/rest/client/RequestHeader");
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const axios = require('axios');

// Other Libs
const { setTimeout } = require('timers');
const individualServices = require("./../../IndividualServicesService.js");
const logger = require('../../LoggingService.js').getLogger();

const DEVICE_NOT_PRESENT = -1;
let maximumNumberOfRetries = 1;
let responseTimeout = 600;
let slidingWindowSizeDb = 500;
let slidingWindowSize = 3;
let deviceListSyncPeriod = 3;
let slidingWindow = [];
let deviceList = [];
let lastDeviceListIndex = -1;
let stop = false;
var handle = 0;
let loopStartTime = 0;

// String constants
const NODE_ID = 'node-id';


/*
 * Function that send request to retrieve Mac Table from specific device
*/
async function sendRequest(device, user, originator, xCorrelator, traceIndicator, customerJourney) {

  const body = {
    "mount-name": device[NODE_ID]
  };

  try {
    // Sent request to "read current MacTable from Device"
    await individualServices.readCurrentMacTableFromDeviceInternal(body, user, originator, xCorrelator, traceIndicator, customerJourney);

    return {
      'ret': {
        'code': 200,
        'message': 'Correctly Managed'
      },
      'node-id': device[NODE_ID]
    };
  } catch (error) {
    logger.error("CycleProcess: message - " + error.message);
    if (error.message.startsWith("Empty data from") || error.message.startsWith("Writing operation into Elastic")) {
      return {
        'ret': {
          'code': 200,
          'message': error.message
        },
        'node-id': device[NODE_ID]
      };
    } else {

      return {
        'ret': {
          'code': 500,
          'message': error.message
        },
        'node-id': device[NODE_ID]
      };
    }

  }
}

/**
 * Returns a device object for the sliding window adding timeout informations
 */
function prepareObjectForWindow(deviceListIndex) {
  try {
    let windowObject = {
      "index": deviceListIndex,
      "node-id": deviceList[deviceListIndex],
      "ttl": responseTimeout,
      "retries": maximumNumberOfRetries
    };
    return windowObject;
  } catch (error) {
    logger.error("Error in prepareObjectForWindow (" + error + ")");
  }
}

/**
 * Check a device inside the sliding window
 *
 * Returns the position inside the Sliding Window
 * If doesn't exist returns DEVICE_NOT_PRESENT
 */
function checkDeviceExistsInSlidingWindow(deviceNodeId) {
  try {
    for (let i = 0; i < slidingWindow.length; i++) {
      if (slidingWindow[i][NODE_ID] == deviceNodeId) {
        return i;
      }
    }
    return DEVICE_NOT_PRESENT;
  } catch (error) {
    logger.error("Error in checkDeviceExistsInSlidingWindow (" + error + ")");
  }
}


/**
 * Returns the next element index of the device list ready to be inserted in sliding window
 */
function getNextDeviceListIndex() {
  try {
    if (deviceList.length == 0) {
      lastDeviceListIndex = -1;
    } else if (lastDeviceListIndex >= (deviceList.length - 1)) {
      lastDeviceListIndex = 0;
      stop = true;
    } else {
      lastDeviceListIndex += 1;
    }
    return lastDeviceListIndex;
  } catch (error) {
    logger.error("Error in getNextDeviceListIndex (" + error + ")");
  }
}


/**
 * Add the next element of Device List into the Sliding Window
 */
function addNextDeviceListElementInWindow() {
  try {
    let counter = 0
    let elementAdded = false
    do {
      if (counter >= deviceList.length) {
        return;
      }
      counter += 1
      let newDeviceListIndex = getNextDeviceListIndex();
      if (newDeviceListIndex == -1) {
        logger.debug('+++++ addNextDeviceListElementInWindow: newDeviceListIndex = -1 +++++')
        return false
      }

      if (stop != true) {
        if (checkDeviceExistsInSlidingWindow(deviceList[newDeviceListIndex]) != DEVICE_NOT_PRESENT) {
          logger.debug('+++++ Element ' + deviceList[newDeviceListIndex] + ' (index: ' + newDeviceListIndex + ') already exists in Sliding Window +++++')
        } else {
          slidingWindow.push(prepareObjectForWindow(newDeviceListIndex));
          elementAdded = true;
        }
      }
      else {
        break;
      }

    } while (!elementAdded);

    return elementAdded;
  } catch (error) {
    logger.error("Error in addNextDeviceListElementInWindow (" + error + ")")
  }
}

/**
 * Pops the element identified by its node-id from the Device List
 */
function discardElementFromDeviceList(nodeId) {
  try {
    for (let i = 0; i < deviceList.length; i++) {
      if (deviceList[i] == nodeId) {
        deviceList.splice(i, 1);
        if (lastDeviceListIndex > i) {
          lastDeviceListIndex -= 1;
        }
      }
    }
  } catch (error) {
    logger.error("Error in discardElementFromDeviceList (" + error + ")");
  }
}

/**
 * Helper function: prints all the list node-id(s) in the form of array
 */
function printList(listName, list) {
  let listGraph = listName + ': [';
  for (let i = 0; i < list.length; i++) {
    listGraph += (i < list.length - 1) ? (list[i][NODE_ID] + '|') : list[i][NODE_ID];
  }
  listGraph += "] (" + list.length + ")";
  return listGraph;
}


function printListDevice(listName, list) {
  let listGraph = listName + ': [';
  for (let i = 0; i < list.length; i++) {
    listGraph += (i < list.length - 1) ? (list[i] + '|') : list[i];
  }
  listGraph += "] (" + list.length + ")";
  return listGraph;
}

function convertTime(s) {
  const ms = s % 1000;
  s = (s - ms) / 1000;
  const secs = s % 60;
  s = (s - secs) / 60;
  const mins = s % 60;
  const hrs = (s - mins) / 60;

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


/**
 * Timeout checking cycle
 *
 * When time-to-live achieves zero another request gets done and ttl reset to the original value.
 * When even all the retries achieve zero the sliding window element is discarded from both the lists.
 */
function startTtlChecking() {
  try {
    function upgradeTtl() {
      for (let index = 0; index < slidingWindow.length; index++) {
        slidingWindow[index].ttl -= 1;
        if (slidingWindow[index].ttl == 0) {
          if (slidingWindow[index].retries == 0) {
            logger.error("Element " + slidingWindow[index][NODE_ID] + " Timeout/Retries. -> Dropped from Sliding Window");
            slidingWindow.splice(index, 1);
            if (addNextDeviceListElementInWindow()) {
              logger.info('Added element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in window and sent request...');
              requestMessage(slidingWindow.length - 1);
            }
            else {
              logger.debug(printListDevice('Device List', deviceList));
              logger.warn('Sliding Window IS EMPTY');
            }

          } else {
            slidingWindow[index].ttl = responseTimeout;
            slidingWindow[index].retries -= 1;
            logger.warn("Element " + slidingWindow[index][NODE_ID] + " Timeout. -> Resend the request...");
            requestMessage(index);
          }
        }
      }
      if (slidingWindow.length == 0) {
        clearInterval(handle);
        handle = 0; // I just do this so I know I've cleared the interval
        stop = false;

        const now = new Date();
        let timeSpent = now.getTime() - loopStartTime;

        let timeFormatted = convertTime(timeSpent);

        logger.info('MATR CYCLE DURATION:' + timeFormatted);

        MATRCycle(false);
      }
    }

    handle = setInterval(upgradeTtl, 1000);

  } catch (error) {
    logger.error("Error in startTtlChecking (" + error + ")");
  }
}

/**
 * Performs the request
 * 
 * If the element responds, it is discarded from sliding window and another
 * element from device list is added then its request is immediatly done.
 */
async function requestMessage(index) {
  try {
    if (index >= slidingWindow.length) {
      return;
    }

    if (slidingWindow.length == 0) {
      return;
    }

    // Use a dynamic header
    let requestHeader = new RequestHeader("MacAddressTableRecorder", "MacAddressTableRecorder", undefined, "1");
    let user = requestHeader.user;
    let originator = requestHeader.originator;
    let xCorrelator = requestHeader.xCorrelator;
    let traceIndicator = requestHeader.traceIndicator;
    let customerJourney = requestHeader.customerJourney;

    sendRequest(slidingWindow[index], user, originator, xCorrelator, traceIndicator, customerJourney).then(retObj => {
      if (retObj.ret.code != 200) { // Response error
        // Response error management
        let elementIndex = checkDeviceExistsInSlidingWindow(retObj[NODE_ID]);
        if (elementIndex == DEVICE_NOT_PRESENT) {
          logger.warn('Response NOK from element ' + retObj[NODE_ID] + ' not more present in Sliding Window. Ignore that.');
        }
        else {
          if (slidingWindow[elementIndex].retries == 0) {
            logger.error(retObj.ret.code + ' - ' + retObj.ret.message + ' from element (II time) ' + retObj[NODE_ID] + ' --> Dropped from Sliding Window');
            slidingWindow.splice(elementIndex, 1);
            if (addNextDeviceListElementInWindow()) {
              logger.info('Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in Sliding Window and send request...');
              //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
              //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
              requestMessage(slidingWindow.length - 1);
            }
            else {
              //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
              logger.warn('Sliding Window IS EMPTY');
            }

          } else {
            logger.error(retObj.ret.code + ' - ' + retObj.ret.message + ' from element (I time) ' + retObj[NODE_ID] + ' Resend the request....');
            slidingWindow[elementIndex].ttl = responseTimeout;
            slidingWindow[elementIndex].retries -= 1;
            requestMessage(elementIndex);
          }
        }
      } else { // Response is like 2XX - OK
        logger.info('****************************************************************************************************');
        let elementIndex = checkDeviceExistsInSlidingWindow(retObj[NODE_ID]);
        if (elementIndex == DEVICE_NOT_PRESENT) {
          logger.warn('Response OK from element ' + retObj[NODE_ID] + ' not more present in Sliding Window. Ignore that.');
        } else {
          logger.info('Response OK from element ' + retObj[NODE_ID] + ' --> Dropped from Sliding Window. Timestamp: ' + Date.now(),);
          slidingWindow.splice(elementIndex, 1);
          if (addNextDeviceListElementInWindow()) {
            logger.info('Add element ' + slidingWindow[slidingWindow.length - 1][NODE_ID] + ' in Sliding Window and send request...');
            //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
            //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
            requestMessage(slidingWindow.length - 1);
          }
          else {
            //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
            //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
          }

        }
        logger.info('****************************************************************************************************');
      }
    })
  } catch (error) {
    logger.error("Error in requestMessage (" + error + ")");
  }
}


async function extractProfileConfiguration(uuid) {
  
  let profile = await profileCollection.getProfileAsync(uuid);
  let objectKey = Object.keys(profile)[2];
  profile = profile[objectKey];
  return profile["integer-profile-configuration"]["integer-value"];
}

/**
 * Entry point function
 * 
 * It starts the cyclic process enabling the time to live check
 * 
 * deviceList: list of devices in connected state. It's optional. If
 *             deviceList is present the procedure will starts immediatly
 **/
module.exports.embeddingCausesCyclicRequestsForUpdatingMacTableFromDeviceAtMatr = async function (logging_level) {
  MATRCycle(true);
}

async function MATRCycle(firstTime) {

  let deviceListMount = null;
  let remainder = 0;

  const forwardingName = "EmbeddingCausesCyclicRequestsForUpdatingMacTableFromDeviceAtMatr";
  const forwardingConstruct = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(forwardingName);
  let coreModelPrefix = forwardingConstruct.name[0].value.split(':')[0];
  let prefix = forwardingConstruct.uuid.split('op')[0];
  slidingWindowSizeDb = await extractProfileConfiguration(prefix + "integer-p-000");
  responseTimeout = await extractProfileConfiguration(prefix + "integer-p-001");
  maximumNumberOfRetries = await extractProfileConfiguration(prefix + "integer-p-002");

  try {
    //deviceListSyncPeriod = await extractProfileConfiguration(prefix + "integer-p-003");

    if (firstTime === false) {
      const now = new Date();
      const periodicSynchTime = deviceListSyncPeriod * 60 * 1000;

      let nextTimeStart = now.getTime() - now.getTime() % periodicSynchTime + periodicSynchTime;
      remainder = nextTimeStart - now.getTime();

      const date = new Date(nextTimeStart);
      logger.info('NEXT MATR CYCLE START AT TIME:' + date);

    }
    else {
      remainder = 0;
      logger.info('NEXT MATR CYCLE START IMMEDIATELY');
    }
  }
  catch (error) {
    logger.warn('NO Device List Sync Period');
  }


  setTimeout(async () => {
    let startDate = new Date();
    loopStartTime = startDate.getTime();

    let day = startDate.getDate();
    let month = startDate.getMonth() + 1;
    let year = startDate.getFullYear();
    let hours = startDate.getHours();
    let minutes = startDate.getMinutes();
    let seconds = startDate.getSeconds();

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    const formattedDate = `${day}/${month}/${year} ${formattedHours}:${formattedMinutes}:${formattedSeconds}`;

    logger.info('*****************************************************************');
    logger.info(' MATR CYCLE START AT:    ' + formattedDate);
    logger.info('*****************************************************************');

    print_log_level = logging_level;

    // Use a dynamic header
    let requestHeader = new RequestHeader("MacAddressTableRecorder", "MacAddressTableRecorder", undefined, "1");

    let user = requestHeader.user;
    let originator = requestHeader.originator;
    let xCorrelator = requestHeader.xCorrelator;
    let traceIndicator = requestHeader.traceIndicator;
    let customerJourney = requestHeader.customerJourney;

    try {
      do {
        deviceListMount = await individualServices.updateCurrentConnectedEquipment(user, originator, xCorrelator, traceIndicator, customerJourney);
      } while (deviceListMount == null);

      deviceList = deviceListMount['mount-name-list'];

      slidingWindowSize = (slidingWindowSizeDb > deviceList.length) ? deviceList.length : slidingWindowSizeDb;

      lastDeviceListIndex = -1;
      for (let i = 0; i < slidingWindowSize; i++) {
        addNextDeviceListElementInWindow();
        requestMessage(i);
        logger.info('Element ' + slidingWindow[i][NODE_ID] + ' send request...');
      }

      //printLog(printList('Sliding Window - MAIN', slidingWindow), print_log_level >= 1);
      startTtlChecking();
    }
    catch (error) {
      logger.error(error, "Error on MATR cycle: ");
    }

  }, remainder);

}
