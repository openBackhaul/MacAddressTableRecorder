'use strict';

const { elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');


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
exports.provideListOfNetworkElementInterfacesOnPath = function (body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = [{
      "target-mac-address": "01:01:01:01:01:01",
      "mount-name": "305251234",
      "original-ltp-name": "eth-1-0-3",
      "vlan-id": 430,
      "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
    }, {
      "target-mac-address": "01:01:01:01:01:01",
      "mount-name": "305259999",
      "original-ltp-name": "eth-2-0-3",
      "vlan-id": 430,
      "time-stamp-of-data": "2010-11-20T14:30:00+01:00"
    }];
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
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
    var examples = {};
    examples['application/json'] = [{
      "mount-name": "305251234",
      "own-mac-address": "00:00:00:00:00:00",
      "egress-ltp-uuid": "305251234+mac-inf-1234",
      "original-ltp-name": "eth-1-0-3",
      "vlan-id": 17,
      "remote-mac-address": "01:01:01:01:01:01",
      "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
    }, {
      "mount-name": "30525999",
      "own-mac-address": "FF:00:11:00:00:00",
      "egress-ltp-uuid": "305251234+mac-inf-1234",
      "original-ltp-name": "eth-1-0-3",
      "vlan-id": 17,
      "remote-mac-address": "01:01:01:01:01:01",
      "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
    }];
    /*if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }*/


    let client = await elasticsearchService.getClient(false);


    //let indexAlias = await getIndexAliasAsync();
    /*let res1 = await client.get({
      index: "6",
      id: mountName
    });*/

    let res2 = await client.search({
      index: '6', // Sostituisci con il nome del tuo indice
      _source: 'mac-address',
      body: {
        query: {
          regexp: {
            'mac-address.mount-name.keyword': 'mac-address-.*'
          }
        }
      }
    });

    console.log(res2);
    let mergedArray = [];

    const response = { 'application/json': [] };

    const hits = res2.body.hits.hits;
    for (const hit of hits) {
      const source = hit._source['mac-address'];

      for (const element of source) {
        response['application/json'].push(element);
      }
      
    
    }

    if (Array.isArray(response['application/json'])) {
      console.log("myArray è un array.");
    } else {
      console.log("myArray non è un array.");
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
    /*var examples = {};

    examples['application/json'] = {
      "mac-address": [{
        "mount-name": "305251234",
        "own-mac-address": "11:11:11:00:00:00",
        "egress-ltp-uuid": "305251234+mac-inf-1234",
        "original-ltp-name": "eth-1-0-3",
        "vlan-id": 17,
        "remote-mac-address": "01:01:01:01:01:01",
        "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
      }, {
        "mount-name": "305251234",
        "own-mac-address": "00:00:00:00:00:00",
        "egress-ltp-uuid": "305251234+mac-inf-1234",
        "original-ltp-name": "eth-1-0-3",
        "vlan-id": 17,
        "remote-mac-address": "FF:01:01:01:01:01",
        "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
      }, {
        "mount-name": "305251234",
        "own-mac-address": "00:00:00:00:00:00",
        "egress-ltp-uuid": "305251234+mac-inf-1234",
        "original-ltp-name": "eth-1-0-3",
        "vlan-id": 17,
        "remote-mac-address": "FE:01:01:01:01:01",
        "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
      },
      {
        "mount-name": "305251236",
        "own-mac-address": "00:00:00:00:00:00",
        "egress-ltp-uuid": "305251234+mac-inf-1234",
        "original-ltp-name": "eth-1-0-3",
        "vlan-id": 17,
        "remote-mac-address": "FE:01:01:01:01:01",
        "time-stamp-of-data": "2010-11-20T14:00:00+01:00"
      }]
    };

    if (Object.keys(examples).length > 0) {
      resolve(examples['application/json']['mac-address']);
    } else {
      resolve();
    }*/

    let client = await elasticsearchService.getClient(false);
    let mountName = body['mount-name'];

    let res2 = await client.search({
      index: '6', 
      _source: 'mac-address',
      body: {
        query: {
          regexp: {
            'mac-address.mount-name.keyword': 'mac-address-'+ mountName
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

    var response = {};
    response['application/json'] = {
      'mac-address': mergedArray
    };

    if (Object.keys(response).length > 0) {
      resolve(response['application/json']['mac-address']);
    } else {
      resolve();
    }
  });

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
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "request-id": "305251234-101120-1400"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}

