const db = require("../db");
const logic = require("../methods/thirdparty.logic");

function checkUserExistance(name) {
  const userName = name;
  return new Promise(function(resolve) {
    db.NewUser.findOne({ name: userName }, function(err, data) {
      if (err) throw err;
      if (data !== null) {
        resolve("exists");
      } else {
        resolve("not exists");
      }
    });
  });
}

function createUser(user) {
  return new Promise(function(resolve) {
    const currentUser = user;
    const pass = logic.encryptPass(currentUser.pass);
    currentUser.pass = pass;
    const newUser = new db.NewUser(currentUser);
    newUser.save(function(err) {
      if (err) {
        throw err;
      } else {
        resolve("user created");
      }
    });
  });
}

function checkUserPassword(user) {
  return new Promise(function(resolve) {
    db.NewUser.findOne({ name: user.name }, function(err, data) {
      if (err) throw err;
      if (logic.encryptPass(user.pass) === data.pass) {
        resolve(data._id);
        // eslint-disable-next-line no-underscore-dangle
      } else {
        resolve("password does not matches");
      }
    });
  });
}

function findUser(id) {
  return new Promise(function(resolve) {
    db.NewUser.findById({ _id: id }, function(err, data) {
      // eslint-disable-next-line no-underscore-dangle
      resolve(data);
    });
  });
}

module.exports = {
  checkUserExistance,
  createUser,
  checkUserPassword,
  findUser
};
