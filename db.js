const mongoose = require("mongoose");

const mongoDB = process.env.DB_HOST;

mongoose.connect(mongoDB);

const { Schema } = mongoose;

const UserSchema = new Schema({
  name: String,
  pass: String,
  history: [],
  liked: []
});

let NewUser = mongoose.model("Person", UserSchema);

const IdSchema = new Schema({
  id: String,
  time: String
});

let SessionPool = mongoose.model("ids", IdSchema);

module.exports = {
  mongoose,
  NewUser,
  IdSchema,
  SessionPool
};
