const giphy = require("giphy-api")(process.env.GIPHY_KEY);

const db = require("./db");

const logic = require("./thirdparty.logic");

function updateUserHistory(user, keyword) {
  const milliseconds = new Date().getTime();

  let historyLength = user.history.length - 1;
  if (historyLength < 0) {
    historyLength = 0;
  }

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
        resolve(data.history);
      });
    });
  }
  return "this keyword latest in pool";
}

function updateUserFavorites(user, target) {
  return new Promise(function(resolve) {
    db.NewUser.findByIdAndUpdate(user._id, user, { new: true }, function(err) {
      if (err) throw err;
      resolve(target);
    });
  });
}

function findFavorites(target, pool) {
  return new Promise(function(resolve) {
    const result = pool.find(function(item) {
      return item.id === target;
    });
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

    const result = resArrayOne.filter(z => resArrayTwo.indexOf(z) !== -1);
    resolve(result);
  });
}

function gotMatchesFromResponse(arr, word, liked) {
  return new Promise(function(resolve) {
    giphy.id(arr, function(err, res) {
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

    const milliseconds = new Date().getTime();
    if (pool.length !== 0) {
      const targetNumber = logic.randomizer(0, pool.data.length);
      const target = pool.data[targetNumber].id;
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
            gotMatchesFromResponse(result_, target, currentUser.liked).then(
              res_ => {
                resolve(res_);
              }
            );
          });
        } else {
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

module.exports = {
  updateUserHistory,
  randomize
};