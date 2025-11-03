// events.js
const name = "levels";

// イベント
const events = [require("server.js")];

module.exports = events;

const { CanvasSenpai } = require("canvas-senpai");
const canva = new CanvasSenpai();
const { Client, Collection } = require("discord.js");
const Keyv = require("keyv");
const Canvas = require("discord-canvas");
const levels = new Keyv("sqlite://db.sqlite", {
  table: "levels",
});
const Discord = require("discord.js");
const client = new Discord.Client();
const ranks = new Keyv("sqlite://db.sqlite", {
  table: "ranks",
});
client.on("message", async (message) => {
  const rank = (await ranks.get(message.author.id)) || {
    count: 0,
    rank: 1,
  }; //初期ポイント(0にするとエラー)
  const level = (await levels.get(message.author.id)) || {
    count: 0,
    level: 1,
  }; //初期ポイント(0にするとエラー)
  level.count += 1;
  if (level.count >= 100) {
    //最大レベル（最大レベルになると次のランクに行きます)
    level.count = 0;
    level.level += 1;
  }
  if (level.level >= 5) {
    level.level = 1;
    rank.rank += 1;
  }
  levels.set(message.author.id, level);
  ranks.set(message.author.id, rank);
  if (message.content === "ci!rank") {
    message.channel.send("少し待ってね");
    let data = await canva.rankcard({
      link: "https://i.pinimg.com/originals/76/0e/d7/760ed7f52c90870503762ac92db92adc.jpg",
      name: message.author.username,
      discriminator: message.author.discriminator,
      level: level.level,
      rank: rank.rank,
      currentXP: 100 - level.count,
      fullXP: 100,
      avatar: message.author.displayAvatarURL({
        format: "png",
      }),
    });
    const attachment = new Discord.MessageAttachment(data, "rank.png");
    await message.channel.send(``, attachment); //上のdataを発言
    await message.channel.send("現在のランクです！");
  }
});
client.login(process.env.DISCORD_BOT_TOKEN);
