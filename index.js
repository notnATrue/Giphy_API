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

const session = require("./controllers/session");

const auth = require("./controllers/authentication");

const favorites = require("./methods/history.favorites");

function giphySearch(value) {
  return new Promise(resolve => {
    if (value !== "") {
      giphy.search(value, (err, res) => {
        if (err) throw err;
        resolve(res);
      });
    } else {
      giphy.trending((err, res) => {
        resolve(res);
      });
    }
  });
}

app.post("/search", (req, res) => {
  if (req.cookies.session === undefined) {
    res.send("you are not logged in", 201);
  }
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
                if (
                  finalRes[1] === "already liked" ||
                  finalRes[2] !== "epmty response"
                ) {
                  res.send(
                    {
                      searchResponse: giphyRes.data,
                      fromHistory: {
                        history: finalRes[0],
                        likes: finalRes[1]
                      }
                    },
                    201
                  );
                } else {
                  res.send(
                    {
                      searchResponse: giphyRes.data,
                      fromHistory: {
                        history: finalRes[0],
                        likes: finalRes[1]
                      }
                    },
                    201
                  );
                }
              });
            });
          });
        } else {
          res.send("you are not logged in", 201);
        }
      })
      .catch(err => {
        if (err) throw err;
      });
  } else {
    res.send("empty body are not allowed", 201);
  }
});

app.get("/", (req, res) => {
  res.sendfile("index.html");
});

app.post("/signup", (req, res) => {
  if (
    JSON.stringify(req.body) !== "{}" &&
    (!req.body.name === false || !req.body.pass === false) &&
    (req.body.name !== "" && req.body.pass !== "")
  )
    auth.checkUserExistance(req.body.name).then(ifExist => {
      if (ifExist === "not exists") {
        auth.createUser(req.body).then(() => res.send("created", 201));
      } else {
        res.send("already exists", 201);
      }
    });
  else {
    res.send("empty body", 201);
  }
});

app.post("/signin", (req, res) => {
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
            res.send("logged", 201);
          } else {
            res.send("password does not matches", 201);
          }
        });
      } else {
        res.send("user are not exists", 201);
      }
    });
  } else {
    res.send("uncorrect data", 201);
  }
});

app.listen(port);
