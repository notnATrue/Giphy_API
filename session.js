let db = require("./db");

function deleteSession(session) {
  return new Promise(function(resolve) {
    let timer = null;
    timer = setInterval(() => {
      db.sessionPool.deleteOne(session, function(err) {
        if (err) throw err;
        // console.log(data);
        clearInterval(timer);
        resolve();
      });
    }, process.env.TIMER);
  });
}

function addSession(id_) {
  return new Promise(function(resolve) {
    const newSession = new db.SessionPool({
      id: id_,
      expires: Date.now() + 10000
    });
    //
    newSession.save(function(err, data) {
      //   console.log(`add this > ${id_}`);
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
  return new Promise(function(resolve) {
    // console.log(`checkSession id_ ${id_}`);
    db.SessionPool.findOne({ id: id_ }, function(err, data) {
      //   console.log(`data > ${data}`);
      if (err) throw err;
      if (data !== null) {
        // console.log(data);
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
