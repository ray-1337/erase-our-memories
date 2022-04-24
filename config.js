const dotenv = require("dotenv");
const secret = dotenv.config({path: process.cwd() + "/.env"});

module.exports = {
  authorID: secret.parsed["AUTHOR"],
  startMessageID: secret.parsed["STARTID"],
  token: secret.parsed["TOKEN"],
  channelID: secret.parsed["CHANNELID"]
};