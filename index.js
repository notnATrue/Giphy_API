

require("dotenv").config();

const express = require("express");

const app = express();

const port = process.env.PORT;

const bodyParser = require("body-parser");

const cookieParser = require("cookie-parser");

const giphy = require("giphy-api")(process.env.GIPHY_KEY);

app.use(cookieParser());
app.use(bodyParser());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(`${__dirname}/src`));

const db = require('./db');

const logic = require('./thirdparty.logic');

const session = require('./session');

// db.newUser.find(function(err, data) {
//   if (err) throw err;
//   else console.log(data);
// });

// db.sessionPool.find(function(err, data) {
//   if (err) throw err;
//   console.log(data);
// });

// db.newUser.remove({}, function(err, data) {
//     if (err) throw err;
//     else console.log(data);
// });

// db.sessionPool.remove({}, function(err) {
//     if(err) throw err;
// });

function giphySearch(value) {
  return new Promise(function(resolve, reject) {
    if (value !== "") {
      giphy.search(value, function(err, res) {
        if (err) throw err;
        console.log(res);
        resolve(res);
      });
    } else {
      giphy.trending(function(err, res) {
        console.log(res);
        resolve(res);
      });
    }
  });
}

app.post("/search", function(req, res) {
  console.log(req.body);
  if (req.cookies.session !== undefined) {
    if (JSON.stringify(req.body) !== "{}") {
      session.checkSession(req.cookies.session)
        .then(data => {
          if (data === "liquid") {
            console.log("accsess to search");

            giphySearch(req.body.toSearch).then(giphy_res => {
              findUser(req.cookies.session).then(user => {
                Promise.all([
                  updateUserHistory(user, req.body.toSearch),
                  randomize(giphy_res, user)
                ]).then(finalRes => {
                  console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>> result have been sended");
                  if (finalRes[1] === "already liked") {
                    console.log(finalRes[1]);
                    res.send({
                      searchResponse: giphy_res.data,
                      fromHistory: {
                        history: finalRes[0],
                        likes: finalRes[1]
                      }
                    });
                  } else {
                    res.send({
                      searchResponse: giphy_res.data,
                      fromHistory: {
                        history: finalRes[0],
                        likes: finalRes[1]
                      }
                    });
                  }
                });
              });
            });
          } else {
            res.send("you are not logged in");
          }
        })
        .catch(err => {
          if (err) throw err;
        });
    } else {
      console.log("you are not logged in");
      res.send("empty body are not allowed");
    }
  } else {
    res.send("you are not logged in");
  };
});

app.get("/", function(req, res) {
  res.sendfile("index.html");
});

app.post("/signup", function(req, res) {
  // let encrypted = encryptPass(req.body.pass);
  console.log(req.body);
  if (JSON.stringify(req.body) !== "{}" && (!req.body.name === false && !req.body.pass === false))
    checkUserExistance(req.body.name).then(res_ => {
      if (res_ === "not exists") {
        createUser(req.body).then(() => res.send("created"));
      } else {
        res.send("already exists");
      }
    });
  else {
    res.send("empty body");
  }
});

app.post("/signin", function(req, res) {
  checkUserExistance(req.body.name).then(data => {
    if (data === "exists") {
      checkUserPassword(req.body).then(data => {
        if (data !== "password does not matches") {
          console.log(data);
          session.addSession(data);
          res.cookie("session", data, {
            maxAge: process.env.TIMER,
            httpOnly: true
          });
          res.send("logged");
        } else {
          res.send("password does not matches");
        }
      });
    } else {
      res.send("user are not exists");
    }
  });
});

function checkUserExistance(name_) {
  return new Promise(function(resolve, reject) {
    db.newUser.findOne({ name: name_ }, function(err, data) {
      if (err) throw err;
      if (data !== null) {
        resolve("exists");
      } else {
        resolve("not exists");
      }
    });
  });
}

function createUser(user_) {
  return new Promise(function(resolve, reject) {
    const pass = logic.encryptPass(user_.pass);
    user_.pass = pass;
    const newUser_ = new newUser(user_);
    newUser_.save(function(err) {
      if (err) {
        throw err;
      } else {
        console.log(user_);
        resolve("user created");
      }
    });
  });
}

function checkUserPassword(user) {
  return new Promise(function(resolve, reject) {
    db.newUser.findOne({ name: user.name }, function(err, data) {
      if (err) throw err;
      if (logic.encryptPass(user.pass) === data.pass) {
        console.log(data);
        resolve(data._id);
      } else {
        resolve("password does not matches");
      }
    });
  });
};

function findUser(id) {
  return new Promise(function(resolve, reject) {
    db.newUser.findById({ _id: id }, function(err, data) {
      console.log(`founded user by id > ${data}`);
      resolve(data);
    });
  });
}

function updateUserHistory(user, keyword) {
  const milliseconds = new Date().getTime();

  let length_ = user.history.length - 1;
  if (length_ < 0) {
    length_ = 0;
  }
  console.log(`user history > ${user.history[length_]}`);

  if (
    user.history[length_] == undefined ||
    user.history[length_].keyword !== keyword
  ) {
    user.history.push({
      keyword,
      time: milliseconds
    });
    return new Promise(function(resolve, reject) {
      db.newUser.findByIdAndUpdate(user._id, user, { new: true }, function(
        err,
        data
      ) {
        console.log(`liking image > ${data}`);
        resolve(data.history);
      });
    });
  }
  console.log("this keyword latest in pool");
  return "this keyword latest in pool";
}

function updateUserFavorites(user, target) {
  return new Promise(function(resolve, reject) {
    db.newUser.findByIdAndUpdate(user._id, user, { new: true }, function(err, data) {
      if (err) throw err;
      console.log("async done@!");
      resolve(target); // //
    });
  });
};

function randomize(pool, user) {
  return new Promise(function(resolve, reject) {
    const user_ = user;

    console.log(`pool.data.length >>>>>>>>>>${pool.data.length}`);

    const milliseconds = new Date().getTime();
    if (pool.length !== 0) {
      const targetNumber = logic.randomizer(0, pool.data.length);
      console.log(`returnded random number >>>>>>>>>>>${targetNumber}`);
      const target = pool.data[targetNumber].id;
      console.log(`randomized number + id >>> ${target}`);
      findFavorites(target, user.liked).then(founded => {
        if (founded === undefined) {
          const liked = {
            id: target,
            time: milliseconds
          };
          user_.liked.push(liked);

          Promise.all([
            updateUserFavorites(user_, target),
            findInFavoritesFromResponse(pool.data, user_.liked)
          ]).then(result_ => {
            console.log(
              `after promise all result >>>>>>>>>>>>>>>>>>>>>${result_}`
            );
            gotMatchesFromResponse(result_, target, user_.liked).then(res_ => {
              resolve(res_);
            });
          });
        } else {
          console.log(">already liked<");
          return new Promise(function(resolve_, reject) {
            resolve_("already liked");
          })
            .then(() => {
              return findInFavoritesFromResponse(pool.data, user_.liked);
            })
            .then(result_ => {
              const word = "already liked";
              gotMatchesFromResponse(result_, word, user_.liked).then(res_ => {
                resolve(res_);
              });
            });
        }
      });
    }
  });
};

function findFavorites(target, pool) {
  return new Promise(function(resolve, reject) {
    const target_ = target;
    const result = pool.find(function(item) {
      return item.id === target_; // 3oEduV4SOS9mmmIOkw
    });
    console.log(`found favorites > ${result}`);
    resolve(result);
  });
}

function findInFavoritesFromResponse(arr1, arr2) {
  return new Promise(function(resolve, reject) {
    const arr1_ = [];
    const arr2_ = [];
    arr1.forEach(item => {
      arr1_.push(item.id);
    });
    arr2.forEach(item => {
      arr2_.push(item.id);
    });
    // console.log('this is array one ========== ' + arr1_);
    // console.log('this is array two ========== ' + arr2_);

    const result = arr1_.filter(z => arr2_.indexOf(z) !== -1);
    resolve(result);
  });
}

function gotMatchesFromResponse(arr, word, liked) {
  return new Promise(function(resolve, reject) {
    giphy.id(arr, function(err, res) {
      console.log("matches from response<<<<<<<");
      console.log(res.data);
      if (word === "already liked") {
        resolve({
          "matches from response": res.data,
          liked: "already liked",
          "all liked images": liked
        });
      }
      resolve({
        "matches from response": res.data,
        liked: word,
        "all liked images": liked
      });
    });
  });
}

app.listen(port);
