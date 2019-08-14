const mongoose = require("mongoose");

const mongoDB = process.env.DB_HOST;

mongoose.connect(mongoDB);

const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  pass: String,
  history: [],
  liked: []
});

const newUser = mongoose.model("Person", userSchema);

const idSchema = new Schema({
  id: String,
  time: String
});

const sessionPool = mongoose.model("ids", idSchema);

module.exports = {
    mongoose,
    newUser,
    idSchema,
    sessionPool
}