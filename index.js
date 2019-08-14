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

let db = require("./db");

let logic = require("./thirdparty.logic");

let session = require("./session");

let auth = require("./authentication");

// db.NewUser.find(function(err, data) {
//   if (err) throw err;
//   else console.log(data);
// });

// db.SessionPool.find(function(err, data) {
//   if (err) throw err;
//   console.log(data);
// });

// db.NewUser.remove({}, function(err, data) {
//     if (err) throw err;
//     else console.log(data);
// });

// db.SessionPool.remove({}, function(err) {
//     if(err) throw err;
// });

function giphySearch(value) {
  return new Promise(function(resolve) {
    if (value !== "") {
      giphy.search(value, function(err, res) {
        if (err) throw err;
        // console.log(res);
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

function updateUserHistory(user, keyword) {
  const milliseconds = new Date().getTime();

  let historyLength = user.history.length - 1;
  if (historyLength < 0) {
    historyLength = 0;
  }
  // console.log(`user history > ${user.history[historyLength]}`);

  if (
    user.history[historyLength] === undefined ||
    user.history[historyLength].keyword !== keyword
  ) {
    user.history.push({
      keyword,
      time: milliseconds
    });
    return new Promise(function(resolve) {
      db.NewUser.findByIdAndUpdate(user._id, user, { new: true }, function(
        err,
        data
      ) {
        // console.log(`liking image > ${data}`);
        resolve(data.history);
      });
    });
  }
  // console.log("this keyword latest in pool");
  return "this keyword latest in pool";
}

function updateUserFavorites(user, target) {
  return new Promise(function(resolve) {
    db.NewUser.findByIdAndUpdate(user._id, user, { new: true }, function(err) {
      if (err) throw err;
      // console.log("async done@!");
      resolve(target); // //
    });
  });
}

function findFavorites(target, pool) {
  return new Promise(function(resolve) {
    const result = pool.find(function(item) {
      return item.id === target; // 3oEduV4SOS9mmmIOkw
    });
    // console.log(`found favorites > ${result}`);
    resolve(result);
  });
}

function findInFavoritesFromResponse(arr1, arr2) {
  return new Promise(function(resolve) {
    const resArrayOne = [];
    const resArrayTwo = [];
    arr1.forEach(item => {
      resArrayOne.push(item.id);
    });
    arr2.forEach(item => {
      resArrayTwo.push(item.id);
    });
    // console.log('this is array one ========== ' + resArrayOne);
    // console.log('this is array two ========== ' + resArrayTwo);

    const result = resArrayOne.filter(z => resArrayTwo.indexOf(z) !== -1);
    resolve(result);
  });
}

function gotMatchesFromResponse(arr, word, liked) {
  return new Promise(function(resolve) {
    giphy.id(arr, function(err, res) {
      // console.log("matches from response<<<<<<<");
      // console.log(res.data);
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

function randomize(pool, user) {
  return new Promise(function(resolve) {
    const currentUser = user;

    // console.log(`pool.data.length >>>>>>>>>>${pool.data.length}`);

    const milliseconds = new Date().getTime();
    if (pool.length !== 0) {
      const targetNumber = logic.randomizer(0, pool.data.length);
      // console.log(`returnded random number >>>>>>>>>>>${targetNumber}`);
      const target = pool.data[targetNumber].id;
      // console.log(`randomized number + id >>> ${target}`);
      findFavorites(target, user.liked).then(founded => {
        if (founded === undefined) {
          const liked = {
            id: target,
            time: milliseconds
          };
          currentUser.liked.push(liked);

          Promise.all([
            updateUserFavorites(currentUser, target),
            findInFavoritesFromResponse(pool.data, currentUser.liked)
          ]).then(result_ => {
            // console.log(
            //   `after promise all result >>>>>>>>>>>>>>>>>>>>>${result_}`
            // );
            gotMatchesFromResponse(result_, target, currentUser.liked).then(
              res_ => {
                resolve(res_);
              }
            );
          });
        } else {
          console.log(">already liked<");
          return new Promise(function(resolve_) {
            resolve_("already liked");
          })
            .then(() => {
              return findInFavoritesFromResponse(pool.data, currentUser.liked);
            })
            .then(result_ => {
              const word = "already liked";
              gotMatchesFromResponse(result_, word, currentUser.liked).then(
                res_ => {
                  resolve(res_);
                }
              );
            });
        }
      });
    }
  });
}

app.post("/search", function(req, res) {
  // console.log(req.body);
  if (req.cookies.session !== undefined) {
    if (JSON.stringify(req.body) !== "{}") {
      session
        .checkSession(req.cookies.session)
        .then(data => {
          if (data === "liquid") {
            // console.log("accsess to search");

            giphySearch(req.body.toSearch).then(giphyRes => {
              auth.findUser(req.cookies.session).then(user => {
                Promise.all([
                  updateUserHistory(user, req.body.toSearch),
                  randomize(giphyRes, user)
                ]).then(finalRes => {
                  // console.log(
                  //   ">>>>>>>>>>>>>>>>>>>>>>>>>>> result have been sended"
                  // );
                  if (finalRes[1] === "already liked") {
                    console.log(finalRes[1]);
                    res.send({
                      searchResponse: giphyRes.data,
                      fromHistory: {
                        history: finalRes[0],
                        likes: finalRes[1]
                      }
                    });
                  } else {
                    res.send({
                      searchResponse: giphyRes.data,
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
      // console.log("you are not logged in");
      res.send("empty body are not allowed");
    }
  } else {
    res.send("you are not logged in");
  }
});

app.get("/", function(req, res) {
  res.sendfile("index.html");
});

app.post("/signup", function(req, res) {
  // let encrypted = encryptPass(req.body.pass);
  // console.log(req.body);
  if (
    JSON.stringify(req.body) !== "{}" &&
    (!req.body.name === false || !req.body.pass === false) &&
    (req.body.name !== "" && req.body.pass !== "")
  )
    auth.checkUserExistance(req.body.name).then(ifExist => {
      if (ifExist === "not exists") {
        auth.createUser(req.body).then(() => res.send("created"));
      } else {
        res.send("already exists");
      }
    });
  else {
    res.send("empty body");
  }
});

app.post("/signin", function(req, res) {
  if (
    JSON.stringify(req.body) !== "{}" &&
    (!req.body.name === false && !req.body.pass === false) &&
    (req.body.name !== "" && req.body.pass !== "")
  ) {
    auth.checkUserExistance(req.body.name).then(data => {
      if (data === "exists") {
        auth.checkUserPassword(req.body).then(cookieId => {
          if (cookieId !== "password does not matches") {
            // console.log(data);
            session.addSession(cookieId);
            res.cookie("session", cookieId, {
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
  } else {
    res.send("uncorrect data");
  }
});

app.listen(port);
