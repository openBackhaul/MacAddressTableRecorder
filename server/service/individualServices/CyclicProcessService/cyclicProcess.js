'use strict';

const { strict } = require('assert');
const { setTimeout } = require('timers');
const path = require("path");
const individualServices = require("./../../IndividualServicesService.js");
const { elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');
const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');

const DEVICE_NOT_PRESENT = -1;
let maximumNumberOfRetries = 1;
let responseTimeout = 600;
let slidingWindowSizeDb = 500;
let slidingWindowSize = 3;
let deviceListSyncPeriod = 3;
let slidingWindow = [];
let deviceList = [];
let lastDeviceListIndex = -1;
let print_log_level = 2;
let stop = false;
var handle = 0;
let loopStartTime = 0;


async function sendRequest(device, user, originator, xCorrelator, traceIndicator, customerJourney) {

    let ret;

    const body = {
        "mount-name": device['node-id']
    };

    console.log("Send Request (" + body["mount-name"] + ")");


    try {
        ret = await individualServices.readCurrentMacTableFromDevice(body, user, originator, xCorrelator, traceIndicator, customerJourney);
        return {
            'ret': { 'code': 200, 'message': 'Correctly Managed' },
            'node-id': device['node-id']
        };
    } catch (error) {
        return {
            'ret': { 'code': 500, 'message': error.message },
            'node-id': device['node-id']
        };
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
        console.error("Error in prepareObjectForWindow (" + error + ")");
        debugger;
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
            if (slidingWindow[i]['node-id'] == deviceNodeId) {
                return i;
            }
        }
        return DEVICE_NOT_PRESENT;
    } catch (error) {
        console.log("Error in checkDeviceExistsInSlidingWindow (" + error + ")");
        debugger;
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
        console.log("Error in getNextDeviceListIndex (" + error + ")");
        debugger;
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
                printLog('+++++ addNextDeviceListElementInWindow: newDeviceListIndex = -1 +++++', print_log_level >= 3)
                return false
            }

            if (stop != true) {
                if (checkDeviceExistsInSlidingWindow(deviceList[newDeviceListIndex]) != DEVICE_NOT_PRESENT) {
                    printLog('+++++ Element ' + deviceList[newDeviceListIndex] + ' (indice: ' + newDeviceListIndex + ') already exists in Sliding Window +++++', print_log_level >= 3)
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
        return true;
    } catch (error) {
        console.log("Error in addNextDeviceListElementInWindow (" + error + ")")
        debugger
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
        console.log("Error in discardElementFromDeviceList (" + error + ")");
        debugger;
    }
}

/**
 * Helper function: prints all the list node-id(s) in the form of array
 */
function printList(listName, list) {
    let listGraph = listName + ': [';
    for (let i = 0; i < list.length; i++) {
        listGraph += (i < list.length - 1) ? (list[i]['node-id'] + '|') : list[i]['node-id'];
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

/**
 * Prints a console log message only the print_log flag is enabled
 */
function printLog(text, print_log) {
    if (print_log) {
        console.log(text);
    }
}

function convertTime(millisecondi) {
    let secondi = Math.floor(millisecondi / 1000);
    let ore = Math.floor(secondi / 3600);
    let minuti = Math.floor((secondi % 3600) / 60);
    let restantiSecondi = secondi % 60;

    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${restantiSecondi.toString().padStart(2, '0')}`;
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
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout/Retries. -> Dropped from Sliding Window", print_log_level >= 2);
                        slidingWindow.splice(index, 1);
                        if (addNextDeviceListElementInWindow()) {
                            printLog('Added element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in window and sent request...', print_log_level >= 2);
                            //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                            requestMessage(slidingWindow.length - 1);
                        }
                        else {
                            printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
                            printLog('Sliding Window IS EMPTY', print_log_level >= 1);
                        }

                    } else {
                        slidingWindow[index].ttl = responseTimeout;
                        slidingWindow[index].retries -= 1;
                        printLog("Element " + slidingWindow[index]['node-id'] + " Timeout. -> Resend the request...", print_log_level >= 2);
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

                printLog('MATR CYCLE DURATION:' + timeFormatted, print_log_level >= 1);

                MATRCycle(false, 2);


            }
        }

        handle = setInterval(upgradeTtl, 1000);

    } catch (error) {
        console.log("Error in startTtlChecking (" + error + ")");
        debugger;
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

        //TO FIX  
        let user = "User Name";
        let originator = "Resolver";
        let xCorrelator = "550e8400-e29b-11d4-a716-446655440000";
        let traceIndicator = "1.3.1";
        let customerJourney = "Unknown value";


        sendRequest(slidingWindow[index], user, originator, xCorrelator, traceIndicator, customerJourney).then(retObj => {
            if (retObj.ret.code != 200) {
                //errore    
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (elementIndex == DEVICE_NOT_PRESENT) {
                    printLog('Response from element ' + retObj['node-id'] + ' not more present in Sliding Window. Ignore that.', print_log_level >= 2);
                }
                else {
                    if (slidingWindow[elementIndex].retries == 0) {
                        printLog('Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (II time) ' + retObj['node-id'] + ' --> Dropped from Sliding Window', print_log_level >= 2);
                        slidingWindow.splice(elementIndex, 1);
                        if (addNextDeviceListElementInWindow()) {
                            printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                            //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
                            //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                            requestMessage(slidingWindow.length - 1);
                        }
                        else {
                            //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
                            printLog('Sliding Window IS EMPTY', print_log_level >= 1);
                        }

                    } else {
                        printLog('Error (' + retObj.ret.code + ' - ' + retObj.ret.message + ') from element (I time) ' + retObj['node-id'] + ' Resend the request....', print_log_level >= 2);
                        slidingWindow[elementIndex].ttl = responseTimeout;
                        slidingWindow[elementIndex].retries -= 1;
                        requestMessage(elementIndex);
                    }
                }
            } else {
                //return OK 
                printLog('****************************************************************************************************', print_log_level >= 2);
                let elementIndex = checkDeviceExistsInSlidingWindow(retObj['node-id']);
                if (elementIndex == DEVICE_NOT_PRESENT) {
                    printLog('Response from element ' + retObj['node-id'] + ' not more present in Sliding Window. Ignore that.', print_log_level >= 2);
                } else {
                    printLog('Response from element ' + retObj['node-id'] + ' --> Dropped from Sliding Window. Timestamp: ' + Date.now(), print_log_level >= 2);
                    slidingWindow.splice(elementIndex, 1);
                    if (addNextDeviceListElementInWindow()) {
                        printLog('Add element ' + slidingWindow[slidingWindow.length - 1]['node-id'] + ' in Sliding Window and send request...', print_log_level >= 2);
                        //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
                        //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                        requestMessage(slidingWindow.length - 1);
                    }
                    else {
                        //printLog(printListDevice('Device List', deviceList), print_log_level >= 2);
                        //printLog(printList('Sliding Window', slidingWindow), print_log_level >= 1);
                    }

                }
                printLog('****************************************************************************************************', print_log_level >= 2);
            }
        })
    } catch (error) {
        console.log("Error in requestMessage (" + error + ")");
        debugger;
    }
}


async function extractProfileConfiguration(uuid) {
    const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
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
    MATRCycle(true, 2);
}

async function MATRCycle(firstTime, logging_level) {

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
        deviceListSyncPeriod = await extractProfileConfiguration(prefix + "integer-p-003");

        if (firstTime === false) {
            const now = new Date();
            const periodicSynchTime = deviceListSyncPeriod * 60 * 1000;

            let nextTimeStart = now.getTime() - now.getTime() % periodicSynchTime + periodicSynchTime;
            remainder = nextTimeStart - now.getTime();

            const date = new Date(nextTimeStart);
            printLog('NEXT MATR CYCLE START AT TIME:' + date, print_log_level >= 1);

        }
        else {
            remainder = 0;
            printLog('NEXT MATR CYCLE START IMMEDIATELY', print_log_level >= 1);
        }
    }
    catch(error)
    {
        printLog('NO Device List Sync Period', print_log_level >= 1);
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

        printLog('*****************************************************************', print_log_level >= 1);
        printLog('                                                                 ', print_log_level >= 1);
        printLog(' MATR CYCLE START AT:    ' + formattedDate, print_log_level >= 1);
        printLog('                                                                 ', print_log_level >= 1);
        printLog('*****************************************************************', print_log_level >= 1);

        print_log_level = logging_level;

        //TO FIX  
        let user = "User Name";
        let originator = "MacAddressTableResolver";
        let xCorrelator = "550e8400-e29b-11d4-a716-446655440000";
        let traceIndicator = "1.3.1";
        let customerJourney = "Unknown value";

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
                printLog('Element ' + slidingWindow[i]['node-id'] + ' send request...', print_log_level >= 2);
            }

            //printLog(printList('Sliding Window - MAIN', slidingWindow), print_log_level >= 1);
            startTtlChecking();
        }
        catch (error) {
            console.error("Error on MATR cycle: " + error);
        }

    }, remainder);

}
