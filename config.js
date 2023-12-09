require("dotenv/config");

module.exports = {
  authorID: process.env.AUTHOR,
  startMessageID: process.env.STARTID,
  token: process.env.TOKEN,
  channelID: process.env.CHANNELID,
  apiVersion: 10
};