const https = require('https');
const querystring = require("querystring");
const http = require('http');


module.exports = function(cfg, logger) {
  var authToken;
  var regx = /<string [a-zA-Z0-9=":/.]+>(.*)<\/string>/;

  function generateToken(callback){
    logger.profile('Bing authorization token');

    var post_data = querystring.stringify({
      'grant_type': 'client_credentials',
      'scope': 'http://api.microsofttranslator.com',
      'client_id': cfg.bing.clientId,
      'client_secret': cfg.bing.clientSecret
    });
    
    var req = https.request({
      hostname: 'datamarket.accesscontrol.windows.net',
      port: 443,
      path: '/v2/OAuth2-13/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': post_data.length
      },
    }, function(res) {
      res.setEncoding('utf8');
      res.on('data', function(response){
        logger.profile('Bing authorization token');
        authToken = JSON.parse(response);
        
        callback(null, authToken);
      });  
    });  
    req.on('error', function(e){
      callback(new Error(e.message), null);
    });
    req.write(post_data);
    req.end();
  }
  

  function translate(text, from, to, callback) {
    logger.profile('Bing translation profile');
    
    var req = http.request({
      host: 'api.microsofttranslator.com',
      port: 80,
      path: '/V2/Http.svc/Translate?text='+encodeURIComponent(text)+'&from='+from+'&to='+to+'&contentType=text/plain',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer '+authToken.access_token
      }
    });
    
    req.on('response', function(response){
      var data = '';
      
      response.on('data', function(chunk){
        data += chunk;
      });
      
      response.on('end', function(){
        logger.profile('Bing translation profile');
        
        var error, translation;
        
        try {
          logger.debug('bing data: ', data);
          translation = regx.exec(data)[1];
          logger.debug('bing translation: ', translation);
        } catch(e) {
          logger.error('error on bing translte', e);
          error = 'parse-exception';
        }
        
        callback(error, {
          original_text: text,
          translated_text: translation,
          from_language: from,
          to_language: to,
          response: data
        });
      });
    });
    
    req.on('error', function(e){
      callback(new Error(e.message), null);
    });
    
    req.end();
  }

  return {
    generateToken: generateToken,
    translate: translate
  };
};
