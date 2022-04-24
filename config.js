const dotenv = require("dotenv");
const secret = dotenv.config({path: process.cwd() + "/.env"});

module.exports = {
  token: secret.parsed["TOKEN"]
};