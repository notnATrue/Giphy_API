const db = require("../db");
const logic = require("../methods/thirdparty.logic");

function checkUserExistance(name) {
  const userName = name;
  return new Promise(resolve => {
    db.NewUser.findOne({ name: userName }, (err, data) => {
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
  return new Promise(resolve => {
    const currentUser = user;
    const pass = logic.encryptPass(currentUser.pass);
    currentUser.pass = pass;
    const newUser = new db.NewUser(currentUser);
    newUser.save(err => {
      if (err) {
        throw err;
      } else {
        resolve("user created");
      }
    });
  });
}

function checkUserPassword(user) {
  return new Promise(resolve => {
    db.NewUser.findOne({ name: user.name }, (err, data) => {
      if (err) throw err;
      if (logic.encryptPass(user.pass) === data.pass) {
        resolve(data._id);
      } else {
        resolve("password does not matches");
      }
    });
  });
}

function findUser(id) {
  return new Promise(resolve => {
    db.NewUser.findById({ _id: id }, (err, data) => {
      if (err) throw err;
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
