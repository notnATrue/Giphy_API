let express = require('express');
  
let app = express();

const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');

let request = require('request');

let giphy = require('giphy-api')('YUynZ9RTOQfzkegJPJeI3R3wg3UZe9Jv');

const uuidv1 = require('uuid/v1');

var setCookie = require('set-cookie');

const MongoClient = require('mongodb').MongoClient;

const assert = require('assert');


app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
    
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/src'));



const url = 'mongodb://localhost:27017';
 
const dbName = 'myproject';
 
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
 
  const db = client.db(dbName);
 
  client.close();
});

// MongoClient.connect('mongodb://localhost:27017/myNewDB',function (err,db) {
//     if(err) 
//         console.log("Unable to connect DB. Error: " + err)
//     else 
//         console.log('Connected to DB');

//     db.close();
// });

let cookie_ = uuidv1({
    node: [0x01, 0x23, 0x45, 0x67, 0x89, 0xab],
    clockseq: 0x1234,
    msecs: new Date(Date.now()).getTime(),
    nsecs: 5678
    });


// giphy.search('pokemon', function (err, res) {
//    if (err) throw err;
//    console.log(res);
// });

app.get('/', function(req, res) {
    res.sendfile('index.html');
    console.log(res.cookies);
});

app.listen(port);