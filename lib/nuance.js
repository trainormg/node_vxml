const https = require('https');
const fs = require('fs');
const querystring = require("querystring");

module.exports = function(cfg) {

  // converte un file audio in testo chiamando il servizio http Nuance  
  function speechToText(fileName, id, callback) {
    console.time('Nuance speechToText');
  
    // legge la dimesione del file per calcolare content-length
    // andranno aggiunt 5 byte per il terminatore chunked "0\r\n\r\n"
    var fsize = fs.statSync(fileName).size;
    
    var headers = {
      'Content-Type': 'audio/x-wav;codec=pcm;bit=16;rate=8000',
      'Accept-Language': 'ita-ITA',
      'Transfer-Encoding': 'chunked',
      'Accept': 'application/xml',
      'Accept-Topic': 'Dictation',
      'Content-Length': fsize + 5
    };
    
    // appId e appKey sono privati, vengono letti dal file di configurazione
    var options = {
      hostname: 'dictation.nuancemobility.net',
      path: '/NMDPAsrCmdServlet/dictation?' + querystring.stringify({
        appId: cfg.nuance.appId,
        appKey: cfg.nuance.appKey,
        id: id}),
      method: 'POST',
      headers: headers
    };
    
    //console.log(JSON.stringify(options));
    var body = '';
    
    var req = https.request(options, function(res) {
      console.log('nuance call statusCode: ', res.statusCode);
//      console.log('headers: ', res.headers);
      
      res.on('data', function(d) {
        console.log('BODY: ' + d);
        body += d.toString();
      });
      
      res.on('end', function() {
//        console.log('end: %s', body);
        console.timeEnd('Nuance speechToText');
        if (res.statusCode == 200) {
          var result = body.split(/[\r\n]+/, 1)[0];
          console.log("nuance stt, file: '%s', result: '%s'", fileName, result);
  
          if (callback) {
            callback(null, result);
          } else {
            console.log("nessuna callback, risultato ignorato");
          }
        } else if (callback) {
          callback(new Error("http error" + res.statusCode));
        }
      });
    });

    req.on('error', function(err) {
      console.error('error on Nuance http request ', err);
      if (callback) {
        callback(err);
      }
    });
    
    // legge il file e lo scrive nel body della request
    var rs = fs.createReadStream(fileName);
    rs.pipe(req);
  }
  
  return {
    speechToText: speechToText
  }
};
