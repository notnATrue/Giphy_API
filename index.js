require('dotenv').config();

let express = require('express');
  
let app = express();

const port = process.env.PORT ;
// || 3000
const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');

let request = require('request');

let giphy = require('giphy-api')(process.env.GIPHY_KEY);

const uuidv1 = require('uuid/v1');

var mongoose = require('mongoose'); 

const assert = require('assert');

let sha256 = require('sha256');

app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
    
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/src'));


const mongoDB = process.env.DB_HOST;

mongoose.connect(mongoDB);

const db = mongoose.connection;

const Schema = mongoose.Schema;

let userSchema = new Schema({
    name: String,
    pass: String,
    history: [],
    liked: [],
});

let newUser = mongoose.model('Person', userSchema);

newUser.find(function(err, data) {
    if (err) throw err;
    else console.log(data);
});

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

app.get('/searching', function(req, res) {
    res.sendfile('searching.html')
})

app.get('/', function(req, res) {
    res.sendfile('index.html');
    console.log(res.cookies);
});

app.post('/signup', function(req, res) {
    console.log(req.body);
    console.log(req.body.pass);
    // let encrypted = encryptPass(req.body.pass);
    checkUserExistance(req.body.name)
    .then(res_ => {
        if (res_ === 'not exists') {
            createUser(req.body)
            .then(() => res.send('created'))
        } else {
            res.send('already exists');
        };
    });
});

app.post('/signin', function(req, res) {
    console.log(req.body);
    checkUserExistance(req.body.name)
    .then((data) => {
        if (data === 'exists') {
            checkUserPassword(req.body)
            .then(data => {
                if (data !== 'password does not matches') {
                    res.cookie('session', data, { maxAge: 10000, httpOnly: true });
                    res.sendfile('searching.html')
                } else {
                    res.send('password does not matches');
                };
            })
        } else {
            res.send('user are not exists')
        }
    });
});

function encryptPass(val) {
    let encrypted = sha256.x2(val);
    return encrypted;
};

function checkUserExistance(name_) {
    return new Promise(function(resolve, reject) {
    newUser.findOne({name: name_}, function(err, data) {
            if (err) throw err;
            if (data !== null) {
                resolve('exists');
            } else {
                resolve('not exists');
            }
        });
    });
};

function createUser(user_) {
    return new Promise(function(resolve, reject) {
        let pass = encryptPass(user_.pass);
        user_.pass = pass;
        let newUser_ = new newUser(user_);
        newUser_.save(function(err) {
            if (err) {
                throw err;
            } else {
                console.log(user_);
                resolve('user created');
            };   
        });
    });
};

function checkUserPassword (user) {
    return new Promise(function(resolve, reject) {
        newUser.findOne({name: user.name}, function(err, data) {
            if (err) throw err;
                if (encryptPass(user.pass) === data.pass) {
                    console.log(data)
                    resolve(data._id);
                } else {
                    resolve('password does not matches');
                };
        });
    });
};

app.listen(port);