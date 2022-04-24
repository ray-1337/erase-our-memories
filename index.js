const Undici = require("undici");
const ms = require("ms");
const jsoning = require("jsoning");

const storage = new jsoning("./messageID.json");

const config = require("./config");
const baseURL = "https://discord.com/api/v9";
const limit = 100;
const headers = {
  Authorization: config.token,
  "User-Agent": "Mozilla/5.0 (Linux; Android 8.0.0; ASUS_X00QD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36"
};

let pause = {
  threshold: 0,
  limit: 5
};

function randomTimer(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
};

// first, collect all the messages, slowly + filtering
async function collectMessages(restartMsgID) {
  if (pause.threshold > pause.limit) {
    console.log("Cooldown started.");
    let limitTime = ms("1h");
    await delay(limitTime);
    pause.threshold = 0;
    console.log("Cooldown ended.");
  };

  try {
    let startPoint = restartMsgID ? restartMsgID : config.startMessageID;
    const fetchMessages = await Undici.request(baseURL + `/channels/${config.channelID}/messages?after=${startPoint}&limit=${limit}`, {
      method: "GET", headers
    });

    if (!fetchMessages) return stop();

    console.log(`Check ${startPoint}`)
  
    let messageIDLoop = [];
    let array = await fetchMessages.body.json();
    if (array instanceof Array) {
      messageIDLoop = array
      .filter(x => x.type == 0 && x.author.id == config.authorID)
      .sort((a, b) => a.id - b.id)
      .map(x => x.id);
    };

    if (!array || !array.length) return stop();

    if (messageIDLoop.length) {
      for (let i = 0; i < messageIDLoop.length; i++) {
        await storage.set("checkpoint", messageIDLoop[i]);

        await deleteMessage(messageIDLoop[i]);

        const delayTime = randomTimer(ms("10s"), ms("2m"));

        console.log(`${messageIDLoop[i]} delay time: ${delayTime} ms`);
        
        await delay(delayTime);

        if (messageIDLoop.length == i) {
          pause.threshold = ++pause.threshold;

          collectMessages(messageIDLoop[i]);

          messageIDLoop = [];

          break;
        };

        continue;
      };
    } else {
      return stop();
    };

    return stop();
  } catch (error) {
    console.error(error);
    return stop();
  };
};

async function deleteMessage(messageID) {
  try {
    await Undici.request(baseURL + `/channels/${config.channelID}/messages/${messageID}`, {
      method: "DELETE", headers
    });

    console.log(`Deleted ${messageID}`)
  } catch (error) {
    console.error(error);
  };
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

async function main() {
  try {
    let checkpoint = await storage.get("checkpoint");
    if (checkpoint) collectMessages(checkpoint);
    else collectMessages();
  } catch (error) {
    console.error(error);
    return stop();
  };
};

function stop() {
  return process.exit(1);
};

main();