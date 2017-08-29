// Express per gestione richieste http e template jade
var express = require('express');

// multer per upload di file in form multipart/form-data
var multer  = require('multer');
var upload = multer({ dest: '../upload' });

var bodyParser = require('body-parser');



// libreria node.js per accesso al file system (per rename file)
const fs = require('fs');

// libreria node.js per generazione id da hash callerId
const crypto = require('crypto');

// inizializza l'applicazione, vedi documentazione Express
var app = express();
// setta jade come template engine
app.set('view engine', 'jade');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded


var config = require("./config");

var winston = require('winston');

require('winston-loggly');
 
// winston.add(winston.transports.Loggly, {
//     token: "dd345110-9200-4061-8841-6c830090aaa5",
//     subdomain: "trainor",
//     tags: ["Winston-NodeJS"],
//     json:true
// });

var logger = new (winston.Logger)({
  level: 'debug',
  transports: [
    new (winston.transports.Console)(),
//  new (winston.transports.File)({ filename: 'somefile.log' })
    new (winston.transports.Loggly)({
      token: config.loggly.token,
      subdomain: config.loggly.subdomain,
      tags: ["Winston-NodeJS"],
      json:true})
  ]
});

logger.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

var morgan = require('morgan');

app.use(morgan('combined', {stream: logger.stream}));

// dipendenza da google rimossa, i servizi sono solo a pagamento
// var google = require("./lib/google")(config);

const assert = require('assert');


// hello world
app.get('/', function (req, res) {
  // console.log(req);
  // res.send('Hello World from Express on Cloud9!');
  res.render('index');
});



app.listen(process.env.PORT, function () {
  logger.info('Example app listening on port ' + process.env.PORT);
});


app.use('/static', express.static('static'));


// prove per telestax, andrebbero in altra applicazione

function logRequest(req) {
    // logger.debug("headers: %s", JSON.stringify(req.headers));
    logger.info("url: %s", req.url);
    logger.debug("body: %s", JSON.stringify(req.body));
}

app.all('/callback', function(req, res) {
    logger.info("callback: '%s'", req.url);
    logRequest(req);
    res.send('OK');
});

app.all('/partial', function(req, res) {
    logger.info("partial result: '%s'", req.url);
    logRequest(req);
    res.send('');
});


app.all('/as/:template', function(req, res) {
    var toRender = "tx_" + req.params.template;
    logger.info("call %s: '%s'", toRender, req.url);
    logRequest(req);
    res.type('xml');
    res.render(toRender, req.query);
});

// app.all('/as/start', function(req, res) {
//     logger.info("call start: '%s'", req.url);
//     logRequest(req);
//     res.type('xml');
//     res.render('tx_start', req.query);
// });

// app.all('/as/callda', function(req, res) {
//     logger.info("callda: '%s'", req.url);
//     logRequest(req);
//     res.type('xml');
//     res.render('tx_callda', req.query);
// });

// app.all('/as/gather', function(req, res) {
//     logger.info("gather: '%s'", req.url);
//     // logRequest(req);
//     res.type('xml');
//     res.render('tx_start', req.query);
// });

var fileSystem = require('fs'),
    path = require('path');


// app.get('/files', function(req, res) {
//     res.end(fileSystem.readFileSync('./static/' + req.query.file));
// })


