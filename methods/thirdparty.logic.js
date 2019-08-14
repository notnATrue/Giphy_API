const sha256 = require("sha256");

function randomizer(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function encryptPass(val) {
  const encrypted = sha256.x2(val);
  return encrypted;
}

module.exports = {
  randomizer,
  encryptPass
};
