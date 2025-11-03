const http = require("http");
const cron = require("node-cron");
const querystring = require("querystring");
const discord = require("discord.js");
const client = new discord.Client();
const events = require("./events.js");

// プレフィックス
var prefix = "ci!";

http
  .createServer(function (req, res) {
    if (req.method == "POST") {
      var data = "";
      req.on("data", function (chunk) {
        data += chunk;
      });
      req.on("end", function () {
        if (!data) {
          res.end("No post data");
          return;
        }
        var dataObject = querystring.parse(data);
        console.log("post:" + dataObject.type);
        if (dataObject.type == "wake") {
          console.log("Woke up in post");
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Discord Bot is active now\n");
    }
  })
  .listen(300);

client.on("ready", (message) => {
  console.log("Bot準備完了～");
  client.user.setPresence({ activity: { name: "げーむ" } });
});
client.on("ready", (message) => {
  client.user.setPresence({ game: { name: "あたい最強！｜ci!help" } });
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

client.login(process.env.DISCORD_BOT_TOKEN);
