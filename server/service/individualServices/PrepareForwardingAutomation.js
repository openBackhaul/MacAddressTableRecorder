const prepareALTForwardingAutomation = require('onf-core-model-ap-bs/basicServices/services/PrepareALTForwardingAutomation');

exports.OAMLayerRequest = function (uuid) {
  return new Promise(async function (resolve, reject) {
    try {
      let applicationLayerTopologyForwardingInputList = await prepareALTForwardingAutomation.getALTForwardingAutomationInputForOamRequestAsync(
        uuid
      );
      if (applicationLayerTopologyForwardingInputList) {
        resolve(applicationLayerTopologyForwardingInputList);
      }
    } catch (error) {
      reject(error);
    }
  });
}