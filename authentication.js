const db = require('./db');
const logic = require('./thirdparty.logic');

function checkUserExistance(name_) {
    return new Promise(function(resolve, reject) {
      db.NewUser.findOne({ name: name_ }, function(err, data) {
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
      const newUser_ = new db.NewUser(user_);
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
      db.NewUser.findOne({ name: user.name }, function(err, data) {
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
      db.NewUser.findById({ _id: id }, function(err, data) {
        console.log(`founded user by id > ${data}`);
        resolve(data);
      });
    });
  }

module.exports = {
    checkUserExistance,
    createUser,
    checkUserPassword,
    findUser
}