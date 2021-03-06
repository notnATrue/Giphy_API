const db = require("../db");

function deleteSession(session) {
  return new Promise(resolve => {
    let timer = null;
    timer = setInterval(() => {
      db.SessionPool.deleteOne(session, err => {
        if (err) throw err;
        clearInterval(timer);
        resolve();
      });
    }, process.env.TIMER);
  });
}

function addSession(id_) {
  return new Promise(resolve => {
    const newSession = new db.SessionPool({
      id: id_,
      expires: Date.now() + 10000
    });
    newSession.save((err, data) => {
      if (err) throw err;
      if (data !== null) {
        resolve("added");
      } else {
        resolve("liquid");
      }
    });
    deleteSession({ id: id_ });
  });
}

function checkSession(id_) {
  return new Promise(resolve => {
    db.SessionPool.findOne({ id: id_ }, (err, data) => {
      if (err) throw err;
      if (data !== null) {
        resolve("liquid");
      } else {
        resolve("session are not liquid");
      }
    });
  });
}

module.exports = {
  deleteSession,
  addSession,
  checkSession
};

// db.NewUser.remove({}, function(err, data) {
//     if (err) throw err;
//     else console.log(data);
// });

// db.SessionPool.remove({}, function(err) {
//     if(err) throw err;
// });
