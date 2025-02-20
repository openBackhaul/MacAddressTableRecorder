'use strict';
var fileOperation = require('onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver');
const { elasticsearchService } = require('onf-core-model-ap/applicationPattern/services/ElasticsearchService');

/**
 * Returns entire data tree
 *
 * returns inline_response_200_8
 **/
exports.getControlConstruct = function () {
  return new Promise(async function (resolve, reject) {
    let value = await fileOperation.readFromDatabaseAsync("core-model-1-4:control-construct");
    let response = {};

    response['application/json'] = {
      "core-model-1-4:control-construct": value
    };
    if (Object.keys(response).length > 0) {
      resolve(response[Object.keys(response)[0]]);
    } else {
      resolve();
    }
  });




  /*let client1 = await elasticsearchService.getClient(false);
  const response = await client1.index({
    index: 'control_construct', 
    body: CCon, 
  });


  //control_construct: l'index l'ho messo io in ES con postman
 
  //let indexAlias1 = await getIndexAliasAsync();
  let res1 = await client1.search({
    index: "control_construct",
    filter_path: "hits.hits._source",
    body: {
      "query": {
        "match_all": {}
      }
    }
  });

  if (Object.keys(res1.body).length === 0) {
    throw new Error(`Could not find existing control-construct with UUID ${controlConstructUuid}`);
  }
  //let controlConstruct = createResultArray(res1);


});*/


}


/**
 * Returns entire instance of Profile
 *
 * uuid String 
 * returns inline_response_200_9
 **/
exports.getProfileInstance = function (url) {
  return new Promise(async function (resolve, reject) {
    try {
      var value = await fileOperation.readFromDatabaseAsync(url);
      var response = {};
      response['application/json'] = {
        "core-model-1-4:profile": value
      };
      if (Object.keys(response).length > 0) {
        resolve(response[Object.keys(response)[0]]);
      } else {
        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

