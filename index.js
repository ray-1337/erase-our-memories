const {request} = require("undici");
const ms = require("ms");
const {webcrypto} = require("crypto");

let checkpoint = null;

const config = require("./config");
const baseURL = "https://discord.com/api/v" + config.apiVersion;
const limit = 100;
const delayStop = 5; // how much will be deleted in a single session before cooldown

const headers = {
  Authorization: config.token,
  "User-Agent": "Mozilla/5.0 (Linux; Android 8.0.0; ASUS_X00QD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Mobile Safari/537.36"
};

let pause = {
  threshold: 0,
  limit: 5
};

function randomTimer(min, max) {
  const array = new Uint32Array(1);
  webcrypto.getRandomValues(array);
  return min + (array[0] % (max - min + 1));
};

// first, collect all the messages, slowly + filtering
async function collectMessages(restartMsgID) {
  if (pause.threshold > pause.limit) {
    console.log("Cooldown started.");
    let limitTime = ms("15m");
    await delay(limitTime);
    pause.threshold = 0;
    console.log("Cooldown ended.");
  };

  try {
    let startPoint = restartMsgID || config.startMessageID;
    const fetchMessages = await request(baseURL + `/channels/${config.channelID}/messages?around=${startPoint}&limit=${limit}`, {
      method: "GET", headers
    });

    if (!fetchMessages || fetchMessages.statusCode >= 400) {
      console.log("Unable to fetch messages.", `[${fetchMessages.statusCode}] ${await fetchMessages.body.text()}`)
      return stop();
    };

    console.log(`Check ${startPoint}`)
  
    let messageIDLoop = [];
    let array = await fetchMessages.body.json();
    if (array instanceof Array) {
      messageIDLoop = array
      .filter(x => [0, 19].includes(x.type) && x.author.id == config.authorID)
      .sort((a, b) => a.id - b.id)
      .map(x => x.id);
    };

    if (!array?.length) {
      console.log("No content presented in array.")
      return stop();
    };

    if (messageIDLoop.length) {
      for (let i = 0; i < messageIDLoop.length; i++) {
        const messageID = messageIDLoop[i];
        checkpoint = messageID

        await deleteMessage(messageID);
        console.log(`Deleted ${messageID} [${i} / ${messageIDLoop.length}]`)

        if (i !== 0 && i % delayStop == 0) {
          const delayTime = randomTimer(ms("15s"), ms("30s"));
          console.log(`${messageID} delay time: ${delayTime} ms`);
          await delay(delayTime);
        };

        if (messageIDLoop.length == i) {
          pause.threshold = ++pause.threshold;

          collectMessages(messageID);

          messageIDLoop = [];

          break;
        };

        continue;
      };
    } else {
      console.log("No messages presented.")
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
    await request(baseURL + `/channels/${config.channelID}/messages/${messageID}`, {
      method: "DELETE", headers
    });
  } catch (error) {
    console.error(error);
  };
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

async function main() {
  try {
    await collectMessages(checkpoint || undefined);
  } catch (error) {
    console.error(error);
    return stop();
  };
};

function stop() {
  return process.exit(128);
};

main();