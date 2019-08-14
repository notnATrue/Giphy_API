const db = require('./db');

function deleteSession(session) {
    return new Promise(function(resolve, reject) {
      let timer = null;
      timer = setInterval(() => {
        db.sessionPool.deleteOne(session, function(err, data) {
          if (err) throw err;
          console.log(data);
          clearInterval(timer);
          resolve();
        });
      }, process.env.TIMER);
    });
  }
  
  function addSession(id_) {
    return new Promise(function(resolve, reject) {
      const newSession = new db.sessionPool({
        id: id_,
        expires: Date.now() + 10000
      });
      //
      newSession.save(function(err, data) {
        console.log(`add this > ${id_}`);
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
    return new Promise(function(resolve, reject) {
      console.log(`checkSession id_ ${id_}`);
      db.sessionPool.findOne({ id: id_ }, function(err, data) {
        console.log(`data > ${data}`);
        if (err) throw err;
        if (data !== null) {
          console.log(data);
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
}