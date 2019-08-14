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

const session = require("./session");

const auth = require("./authentication");

const favorites = require("./history.favorites");

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
        resolve(res);
      });
    }
  });
}

app.post("/search", function(req, res) {
  if (req.cookies.session !== undefined) {
    if (JSON.stringify(req.body) !== "{}") {
      session
        .checkSession(req.cookies.session)
        .then(data => {
          if (data === "liquid") {
            giphySearch(req.body.toSearch).then(giphyRes => {
              auth.findUser(req.cookies.session).then(user => {
                Promise.all([
                  favorites.updateUserHistory(user, req.body.toSearch),
                  favorites.randomize(giphyRes, user)
                ]).then(finalRes => {
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
