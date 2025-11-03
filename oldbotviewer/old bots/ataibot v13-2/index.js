const {
  Client,
  Intents,
  Collection,
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
  Guilds,
  Discord,
} = require("discord.js");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_PRESENCES",
  ],
  ws: { properties: { $browser: "Discord Android" } },
});
const fs = require("fs");
const cron = require("node-cron");
const Keyv = require("keyv");
const levels = new Keyv("sqlite://sqlite/db.sqlite", { table: "lv" });
const xps = new Keyv("sqlite://sqlite/db.sqlite", { table: "xps" });
const counts = new Keyv("sqlite://sqlite/db.sqlite", { table: "counts" });
const scores = new Keyv("sqlite://sqlite/db.sqlite", { table: "scores" });
const pings = new Keyv("sqlite://sqlite/db.sqlite", { table: "dayping" });
const copi = new Keyv("sqlite://sqlite/db.sqlite", { table: "daping" });
const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
const trophys = new Keyv("sqlite://sqlite/db.sqlite", { table: "trophys" });
const { setTimeout } = require("node:timers/promises");
const msgf = require("./function.js");
const lvf = require("./level.js");
// const RPG = require("./rpg.js"); RPG.rpg();
const Canvas = require("canvas");
const prefix = "ci!";

const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "HH";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();

// google Script
const http = require("http");
const querystring = require("querystring");

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
        if (dataObject.type == "wake") {
          console.log(`==== google Scriptに呼ばれたよ By${client.user.tag} ====`);
          const rogin = new MessageEmbed()
            .setTitle("定期ログインだよー")
            .setColor("#71C3FF")
            .setTimestamp();
          client.channels.cache
            .get("1047548728598331402")
            .send({ embeds: [rogin] });
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("rogin");
    }
  })
  .listen(3000);

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands[command.data.name] = command
}

client.on("ready", async () => {
  // 起動したかをLOGSに
  console.log(`==== Logged in: ${client.user.tag} ====`);
  
  const data = []
  for (const commandName in commands) {
        data.push(commands[commandName].data)
    }
    await client.application.commands.set(data);
    console.log("Ready!");
  //ステータス
}); // 起動したかをLOGSに

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) {
        return;
    }
    const command = commands[interaction.commandName];
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true,
        })
    }
});

cron.schedule("0 0 15 * * *", () => {
  const day = pings.get(client.users.cache.get) || { count: 0, count_okz: 0 };
  copi.clear(); //ping reset
  console.log(`0時リセット`);
  var avaram = [
    "https://cdn.glitch.global/ae7cadfc-5cb5-478c-98dd-7cd26b665238/ti1.png?v=1669449827478",
    "https://cdn.glitch.global/ae7cadfc-5cb5-478c-98dd-7cd26b665238/ti2.png?v=1669449832005",
    "https://cdn.glitch.global/ae7cadfc-5cb5-478c-98dd-7cd26b665238/ti3.png?v=1669449833905",
  ]; //avater change
  const am = new MessageEmbed()
    .setTitle("0時リセットだよー")
    .setColor("#71C3FF")
    .setTimestamp();

  client.channels.cache.get("1025950304052707338").send({ embeds: [am] });
  client.user.setAvatar(avaram[Math.floor(Math.random() * avaram.length)]);
});

cron.schedule("10 0 15,23,6,12 * * *", () => {
  const day = pings.get(client.users.cache.get) || { count_okz: 0 };
  pings.clear(day.count_okz); //okz reset

  const am = new MessageEmbed()
    .setTitle("回数リセットだよー")
    .setColor("#71C3FF")
    .setTimestamp();

  client.channels.cache.get("1025950304052707338").send({ embeds: [am] });
}); //0時、8時、15時、21時

// ここからコマンド

client.on("messageCreate", async (message) => {
  const day = (await pings.get(message.author.id)) || { count: 0 };
  const count = (await counts.get(message.author.id)) || { ping_count: 0 };
  const score = (await scores.get(message.author.id)) || { all_ping: 0 };
  const dpn = (await copi.get(message.author.id)) || { day_count: 0 };
    if (message.author.bot) return;
   if (message.content === 'ci!ping') {
    var ping = 0;
    ping = Date.now() - message.createdTimestamp;
    score.all_ping += ping;
    scores.set(message.author.id, score);
    if (message.channel.id === "1001491412992405505" && dpn.day_count >= 1) {
      message.reply("今日はもうやったよー");
      return;
    } else {
      message.reply("あなたの送信速度は`" + `${ping}` + " ms`よ！");
      console.log(`▶ ${message.author.tag}のping値${ping}, allping:${score.all_ping}ms`); // ～ping値をLogsに出力
      if (message.channel.id === "1001491412992405505") {
        dpn.day_count = 1;
        copi.set(message.author.id, dpn);
        console.log(`ok,${day.count}`);
      }
      if (ping >= 200) {
        // ～もしpingが200超えたなら
        message.reply(`200超え！(合計200ping回数${count.ping_count + 1}回)`);
        const embed = new MessageEmbed()
          .setTitle(`${message.author}` + "\nがping値" + `${ping}` + "を出しました！")
          .addFields( { name: 'ユーザー名', value: "> " + `${message.author.tag}` }, { name: '場所', value: "> [" + `${message.guild.name}` + "]の[" + `${message.channel.name}` + "]" }, { name: 'PING値', value: "> " + `${ping}`, inline: true }, { name: '200ping合計', value: "> " + `${count.ping_count + 1}`, inline: true },)
          .setColor("#71C3FF")
          .setTimestamp(); //引数にはDateオブジェクトを入れることができる。何も入れないと今の時間になる

        client.channels.cache
          .get("1048947447881269379")
          .send({ embeds: [embed] });
        
        if (message.channel.id === "1001491412992405505" && count.ping_count >= 1) {
         const lvs = (await levels.get(message.author.id))
    　　　const xs = (await xps.get(message.author.id))
         var sid = message.guild.id
         xs[sid] =  xs[sid] + ping;
         levels.set(message.author.id, lvs);
         xps.set(message.author.id, xs)
    　　　}
        count.ping_count += 1;
        counts.set(message.author.id, count);
        const trophy = (await trophys.get(message.author.id)) || { ktr: false, dfg: false, cfg: false, kmz: false, kmk: false, yky: false, imo: false, kdn: false, moj: false, swk: false };
        if (count.ping_count >= 100 && trophy.ktr == false ){
          trophy.ktr = true;
          message.reply(`実績解除！【カタツムリ】`);
          trophys.set(message.author.id, trophy);
        }
        console.log(`埋め込み送信完了：200ping => ${count.ping_count}`);
        return;
      } else {
        // ～もしpingが200超えてないのなら
        const ping = 0; // ～リセット
        return;
      }
    }
  }
}); //ping値測定

client.on("messageCreate", async (message) => {
    if (message.content === "ci!tes") {
    if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
      let m = message.guild.members.cache.get('1020314992165265478')
      console.log(m);
    }
})
msgf.msg(); //msg.js見ろ
msgf.randomplay();

lvf.level();


//setInterval(function () {

//client.channels.cache.get("1085399783910408283").send("@here");

//}, 1000);

client.login(process.env.DISCORD_BOT_TOKEN)