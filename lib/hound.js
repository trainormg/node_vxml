//var uuid = require('node-uuid');
var crypto = require('crypto');
var request = require("request");
const querystring = require("querystring");


module.exports = function(cfg, logger) {
  var clientId = cfg.hound.clientId,
      clientKey = cfg.hound.clientKey,
      textUrl = cfg.hound.textUrl || 'https://api.houndify.com/v1/text?';

  if (!clientId || !clientKey) {
    throw new Error('Must provide a Client ID and a Client Key');
  }

  function unescapeBase64Url(key) {
    return key.replace(/-/g, '+').replace(/_/g, '/');
  }

  function escapeBase64Url(key) {
    return key.replace(/\+/g, '-').replace(/\//g, '_');
  }

  function signKey(clientKey, message) {
      var key = new Buffer(unescapeBase64Url(clientKey), 'base64');
      var hash = crypto.createHmac('sha256', key).update(message).digest('base64');
      return escapeBase64Url(hash);
  }
  
  function generateAuthHeaders(userId, sessionId, houndRequest) {
  
    // Generate a unique UserId and RequestId.
//    userId = userId || uuid.v1();
  
    // keep track of this requestId, you will need it for the RequestInfo Object
    var requestId = (userId + '-' + Date.now().toString(36));
  
    var requestData = userId + ';' + requestId;
  
    // keep track of this timestamp, you will need it for the RequestInfo Object
    var timestamp = Math.floor(Date.now() / 1000),
        encodedData = signKey(clientKey, requestData + timestamp);

    houndRequest.TimeStamp = timestamp;
    houndRequest.RequestID = requestId;
    
    var headers = {
      'Hound-Request-Authentication': requestData,
      'Hound-Client-Authentication': clientId + ';' + timestamp + ';' + encodedData,
      'Hound-Request-Info': JSON.stringify(houndRequest)
    };
    
    logger.info("hound headers: ", headers);
    return headers;
  }
  
  function askHound(userId, sessionId, query, callback) {
    logger.profile('askHound');
    
    sessionId = sessionId || userId;
    
    var houndRequest = {
      // coordinate di Roma P.le Industria
      Latitude:  41.836769,
      Longitude: 12.474043,
      Country: 'Italy',
      ClientID: clientId,
      UnitPreference: 'METRIC',
      SessionID: sessionId,
      TimeZone: 'Europe/Rome',
      Language: 'en_US'
    };
    
    var headers = generateAuthHeaders(userId, sessionId, houndRequest);
    
    request({
      url: textUrl + querystring.stringify({query: query}),
      headers: headers,
      json: true
    }, function (err, resp, body) {
      if (!err && resp.statusCode == 200) {
        logger.debug('hound response body: ', body);
      } else {
        logger.error('error calling hound [response: %s]: ', (resp && resp.statusCode), err);
        err = err || new Error('hound request failed');
      }
      logger.profile('askHound');
      callback(err, body);
    });

  }
  
  return {
    askHound : askHound
  };
};



//What are the opposites and synonyms of quickly?
// Antonyms of quickly include slowly, and synonyms of quickly include chop-chop, promptly, speedily, rapidly and in short order.

//Who is Barack Obama?
// Barack Hussein Obama II is an American politician currently serving as the 44th President of the United States, the first African American to hold the office.

//Show me the status of the United flight departing from New York to Chicago at 6pm tomorrow
// Found 3 matches for United Airlines flight from New York to Chicago departing at 6:00 pm on November twentieth. The most relevant one based on the given departure time seems to be United Airlines flight 699 which is estimated to depart right on time at 6:00 pm on Friday November twentieth from LaGuardia Airport terminal B gate C11.

//Check flight status
// Then Follow The Prompts

//Convert 1 mile to meters and kilometers.
// 1 mile is equal to 1,609.344 meters. 1 mile is equal to 1.6 kilometers.

//if x plus three equals zero what is x

//Mortgage calculator
// Starting the Mortgage Calculator. What is the principal amount of the mortgage? Then Follow The Prompts

//Calculate 20% tip on $67
// The tip amount is 13 dollars and 40 cents with a bill amount of 67 dollars and a tip of 20 percent.
//What is that divided by two people
// The amount of tip per person is 6 dollars and 70 cents with a bill amount of 67 dollars, a tip of 20 percent and a party of 2 people.

//What tracks are hot in Japan this week?
// Here are the most SoundHounded songs in Japan. The first song is "See You Again" by Wiz Khalifa, and Charlie Puth.
//What about in Portugal?
// Here are the most SoundHounded songs in Portugal. The first song is "Ocean Drive" by Duke Dumont.
//What about for albums instead of songs?
// Here are songs off of the most SoundHounded albums in Portugal. The first song is "Ocean Drive" by Duke Dumont off of the album Blasé Boys Club.
