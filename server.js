// Express per gestione richieste http e template jade
var express = require('express');

// multer per upload di file in form multipart/form-data
var multer  = require('multer');
var upload = multer({ dest: '../upload' });

// libreria node.js per accesso al file system (per rename file)
const fs = require('fs');

// libreria node.js per generazione id da hash callerId
const crypto = require('crypto');

// inizializza l'applicazione, vedi documentazione Express
var app = express();
// setta jade come template engine
app.set('view engine', 'jade');

var config = require("./config");

var winston = require('winston');

var logger = new (winston.Logger)({
    level: 'debug',
    transports: [
      new (winston.transports.Console)(),
//      new (winston.transports.File)({ filename: 'somefile.log' })
    ]
  });



var nuance = require("./lib/nuance")(config, logger);
var bing = require("./lib/bing")(config, logger);

// dipendenza da google rimossa, i servizi sono solo a pagamento
// var google = require("./lib/google")(config);

const assert = require('assert');


// hello world
app.get('/', function (req, res) {
  // console.log(req);
  // res.send('Hello World from Express on Cloud9!');
  res.render('index');
});

// form di prova per upload file
app.get('/test', function (req, res) {
  // nuance.speechToText("../upload/F_record.wav", 'de52072c5f395566ddf94fdc4c4769cdf568e829', function(testo) {
  //   console.log("fine test: '%s'", testo);
  // });
  logger.debug('test page called', req.path);
  res.render('test');
});


function translate(text, callback) {
  bing.translate(text, 'it', 'en', function(err, translation) {
    if (err) {
      logger.error('error in bing translate: ', err);
      callback(err, null);
    } else {
      callback(null, translation.translated_text);
    }
  });
}


function convertSpeechToText(destination, path, id, callback) {
  var fileName = destination + '/' + id + '.wav';
  fs.renameSync(path, fileName);

  nuance.speechToText(fileName, id, function onNuanceDone(err, text) {
  
    if (err) {
      logger.error("Nuance STT error: '%s'", err.message);
      callback(err, {});
    } else {
      logger.debug("fine nuance: '%s'", text);
      callback(null, text);
    }
  });
}

function convertAndTranslate(destination, path, id, callback) {
  logger.info("start convert and translate");
  convertSpeechToText(destination, path, id, function(err, text) {
    var data = {};
    
    logger.debug('conversion done, text: ', text);
    if (err) {
      callback(err, data);
    } else {
      data.text = text;
      translate(text, function(err, translation) {
          logger.debug('translation done, text: ', translation);
          data.translation = translation;
          callback(err, data);
      });
    }
      
  });
}


// riceve il file audio, lo rinomina e lo invia a Nuance per la tradizione in testo
app.post('/stt', upload.single('F_record'), function (req, res) {
  var ani = "ani_undefined";
  var hash = crypto.createHash('sha1');
  
  logger.info('\n**** STT ****');
  logger.profile('process stt request');
  // console.log(req);
  if (req.body) {
    ani = req.body.callerANI || ani;
  }
  hash.update(ani);
  var id = hash.digest('hex');
  
//  res.send('result: <pre>' + JSON.stringify(req.file, null, 2) + '</pre>');
//  fs.rename(req.file.path, req.file.destination + '/F_record.wav');
  convertAndTranslate(req.file.destination, req.file.path, id, function (err, data) {
    data.err = err;
    logger.debug('data: ', data);
    res.render('stt', data);
    logger.profile('process stt request');
  });
  // var fileName = req.file.destination + '/' + id + '.wav';
  // fs.renameSync(req.file.path, fileName);
  // nuance.speechToText(fileName, id, function(err, text) {
  //   if (err) {
  //     console.log("Nuance STT error: '%s'", err.message);
  //   } else {
  //     console.log("fine nuance: '%s'", text);
  //   }
  //   res.render('stt', {text: text, err: err});
  //   console.timeEnd('process stt request');
  // });
  
  // res.render('stt', {testo: 'messaggio di prova'});
  // console.timeEnd('process stt request');
});



app.post('/upload', upload.any(), function (req, res) {
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
  logger.info(req.path);
  res.write('result: <pre>');
  
  req.files.forEach(function(f) {
    res.write(JSON.stringify(f, null, 2));
  });
  res.write('</pre>');
  res.end();
//  fs.rename(req.file.path, req.file.destination + '/F_record.html');
});

app.use('/static', express.static('static'));
//app.use(express.static('html'))

app.all('/main',  function (req, res) {
  logger.info(req.path);
  res.sendFile('static/main.xml', {root: '.'});
});

// esegue il render di una qualunque view (per test)
app.all('/view/:template\.:type', function(req, res) {
    logger.info("view: '%s'", req.url);
    //res.type('xml');
    if (req.params.type) {
      res.type(req.params.type);
    }
//    res.setHeader('X-UA-Compatible', "IE=9");
    res.render(req.params.template, req.query);
});

function generateToken() {
  bing.generateToken( function(err, token) {
    if (err) {
      logger.error("errore: ", err);
    } else {
      logger.debug("bing auth token: ", JSON.stringify(token));
    }
  });
}

generateToken();
setInterval(generateToken, 9*60*1000);

app.listen(process.env.PORT, function () {
  logger.info('Example app listening on port ' + process.env.PORT);
});

