require('dotenv').config();

let express = require('express');
  
let app = express();

const port = process.env.PORT ;

const bodyParser = require("body-parser");

const cookieParser = require('cookie-parser');

let giphy = require('giphy-api')(process.env.GIPHY_KEY);

var mongoose = require('mongoose'); 

let sha256 = require('sha256');

app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());
    
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname + '/src'));


const mongoDB = process.env.DB_HOST;

mongoose.connect(mongoDB);

const Schema = mongoose.Schema;

let userSchema = new Schema({
    name: String,
    pass: String,
    history: [],
    liked: [],
});

let newUser = mongoose.model('Person', userSchema);

let idSchema = new Schema({
    id: String,
    time: String
});

let sessionPool = mongoose.model('ids', idSchema);

newUser.find(function(err, data) {
    if (err) throw err;
    else console.log(data);
});

// newUser.remove({}, function(err, data) {
//     if (err) throw err;
//     else console.log(data);
// });

// sessionPool.remove({}, function(err) {
//     if(err) throw err;
// });

function giphySearch(value) {
    return new Promise(function(resolve, reject) {
        if (value !== '') {
            giphy.search(value, function (err, res) {
                if (err) throw err;
                // console.log(res);
                resolve(res);
             });
        } else {
            giphy.trending(function(err, res) {
                // console.log(res);
                resolve(res);
            })
        };
    });
};

sessionPool.find(function(err, data) {
    if (err) throw err;
    console.log(data)
});

app.get('/searching', function(req, res) {
    res.sendfile(__dirname + '/src/searching.html');
});

app.post('/search', function(req, res) {
    console.log(req.body);
    if (req.cookies.session !== undefined) {
        checkSession(req.cookies.session)
        .then(data => {
            if (data === 'liquid')
            console.log('accsess to search');
            res.send('accsess to search');
            giphySearch(req.body.toSearch)
            .then((giphy_res) => {
                findUser(req.cookies.session)
                .then(user => {
                    Promise.all([updateUserHistory(user, req.body.toSearch), randomize(giphy_res, user)], (err, data) => {
                        console.log(data)
                    })
                    .then(() => {

                    })
                })
            })
        })
        .catch(err => {
            if (err) throw err
        });
        
    } else {
        console.log('you are not logged in');
        res.send('you are not logged in')
    };
});

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

app.post('/signup', function(req, res) {
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
    checkUserExistance(req.body.name)
    .then((data) => {
        if (data === 'exists') {
            checkUserPassword(req.body)
            .then(data => {
                if (data !== 'password does not matches') {
                    console.log(data)
                    addSession(data);
                    res.cookie('session', data, { maxAge: 10000, httpOnly: true });
                    res.send('logged');
                } else {
                    res.send('password does not matches');
                };
            })
        } else {
            res.send('user are not exists');
        };
    });
});

function encryptPass(val) {
    let encrypted = sha256.x2(val);
    return encrypted;
};

function deleteSession(session) {
    return new Promise(function(resolve, reject) {
        let timer = null;
        timer = setInterval(() => {
            sessionPool.deleteOne(session, function(err, data) {
                if (err) throw err;
                console.log(data);
                clearInterval(timer);
            });
        }, 10000);
    });
};

function addSession(id_) {
    return new Promise(function(resolve, reject) {
        let newSession = new sessionPool({
            id: id_,
            expires: Date.now() + 10000
        });
        //
        newSession.save(function(err, data) {
            console.log('add this > ' + id_)
            if (err) throw err;
            if (data !== null) {
                resolve('added');
            } else {
                resolve('liquid')
            };
        });
        deleteSession({id: id_});
    });
};

function checkSession(id_) {
    return new Promise(function(resolve, reject) {
        console.log('checkSession id_ ' + id_ )
        sessionPool.findOne({id: id_}, function(err, data) {
            console.log('data > ' + data)
            if (err) throw err;
            if(data !== null) {
                console.log(data);
                resolve('liquid');
            } else {
                resolve('session are not liquid');
            }
        });
    });
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

async function findUser(id) {
    return new Promise(function(resolve, reject) {
        newUser.findById({_id: id}, function(err, data) {
            console.log('founded user by id > ' + data);
            resolve(data)
        });
    });
};

function updateUserHistory(user, keyword) {
    let milliseconds = new Date().getTime();
    let length_ = user.history.length - 1;
    console.log('user history > ' + user.history[length_]);

    if (user.history[length_].keyword !== keyword) {
        user.history.push({
            "keyword": keyword,
            "time": milliseconds
        });
        return new Promise(function(resolve, reject) {
            newUser.findByIdAndUpdate(user._id, user,{new: true}, function(err, data) {
                console.log('user_data > ' + data)
                resolve(data)
            })
        });
    } else {
        console.log('already exists');
        return;
    };
};

async function updateUserFavorites(user, target) {
    return new Promise(function(resolve, reject) {
        newUser.findByIdAndUpdate(user._id, user, {new: true}, function(err, data) {
            if (err) throw err;
            console.log('async done@!');
            return console.log(data)
        });
    });
};

async function randomize(pool, user) {
    console.log("pool.data.length >>>>>>>>>>" + pool.data.length)
    let milliseconds = new Date().getTime();
        if (pool.length !== 0) {
            let targetNumber = randomizer(0, pool.data.length);
            console.log("returnded random number >>>>>>>>>>>" + targetNumber)
            let target = pool.data[targetNumber].id;
            console.log('randomized number + id >>> ' + target);
           let founded = await findFavorites(target, user.liked);
           console.log("founded >>>>>>>>>>>>>>>>>" + founded);
           if (founded === undefined) {
                user.liked.push({
                    "id": target,
                    "time": milliseconds
                })
                let x = await updateUserFavorites(user, target);
                return x;
           } else {
               return console.log(">already liked<");
           };
            // let y = await findUser;
            // return console.log(x);
        }
}

function randomizer(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

async function findFavorites(target, pool) {
    let target_ = target;
    let result = pool.find(function(item) {
        return item.id === "3oEduV4SOS9mmmIOkw"; //target_
    });
    return result;
};

// function compare(arr1,arr2){
  
//     const objMap={};
    
//   arr1.forEach((e1)=>arr2.forEach((e2)=> {if(e1 === e2){
//          objMap[e1]=objMap[e1]+1||1 ;
//       }
//     }
//   ));
//   console.log(Object.keys(objMap).map(e=>Number(e)));
//   }

app.listen(port);
