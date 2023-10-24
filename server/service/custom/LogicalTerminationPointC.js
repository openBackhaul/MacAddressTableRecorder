/**
 * The LogicalTerminationPoint (LTP) class encapsulates the termination and adaptation functions of one or more technology specific layers 
 * represented by instances of LayerProtocol. 
 * This class provides 
 *      - stub to instantiate and generate a JSON object for a LogicalTerminationPoint. 
 *      - functionality to read the currently configured attribute values of the /core-model-1-4:control-construct/logical-termination-point
 **/
'use strict';
const LogicalTerminationPoint = require('onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint');

const onfPaths = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths');
const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const controlConstruct = require('onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct');

class LogicalTerminationPointC extends LogicalTerminationPoint {
    constructor(uuid, ltpDirection, clientLtp, serverLtp, layerProtocol, additionalProperty) {
        super(uuid, ltpDirection, clientLtp, serverLtp, layerProtocol);    
      }

     /**
     * @description This function returns the layer-protocol list for the given logical-termination-point uuid
     * @param {String} ltpUuid : the value should be a valid string in the pattern
     * '-\d+-\d+-\d+-(http|tcp|op)-(server|client)-\d+$'
     * @returns {Promise<Array>}
     **/
    static async getLayerLtpListAsync(ltpUuid) {
        let ltp = await controlConstruct.getLogicalTerminationPointAsync(ltpUuid);
        if (ltp != undefined) {
            return ltp[onfAttributes.LOGICAL_TERMINATION_POINT.LAYER_PROTOCOL];
        }
        return [];
    }

  }

  module.exports = LogicalTerminationPointC;

