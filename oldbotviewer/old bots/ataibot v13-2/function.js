const {
  Client,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageButton,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
  Discord,
} = require("discord.js");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    "GUILD_MEMBERS",
  ],
  ws: { properties: { $browser: "Discord Android" } },
});
const { setTimeout } = require('node:timers/promises');
const { version, prefix } = require('./config.json');
var isgd = require("isgd");
const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "HH";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();
const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
const Keyv = require("keyv");
const pings = new Keyv("sqlite://sqlite/db.sqlite", { table: "dayping" });
const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
const rensei = new Keyv("sqlite://sqlite/db.sqlite", { table: "rensei" });
const trophys = new Keyv("sqlite://sqlite/db.sqlite", { table: "trophys" });
const ive = new Keyv("sqlite://sqlite/db.sqlite", { table: "ive" });
const xps = new Keyv("sqlite://sqlite/db.sqlite", { table: "xps" });
exports.msg = function () {
  client.on("messageCreate", async (message) => {
     const trophy = (await trophys.get(message.author.id)) || { ktr: false, dfg: false, cfg: false, kmz: false, kmk: false, yky: false, imo: false, kdn: false, moj: false, swk: false };
     const time = formatToTimeZone( now, FORMAT, { timeZone: TIME_ZONE_TOKYO } );
     if (message.author.id == client.user.id || message.author.bot) { return; }
     if (message.mentions.users.has(client.user.id)) {
      message.reply("あたいのこと呼んだ？");
      return;
    }
     if (message.content.startsWith("ci!help")) {
        const text = message.content.split(" ").slice(1).join(" ");
        if (!text) {
          const help = new MessageEmbed()
            .setTitle("へるぷ！(ショートカット)")
            .setColor("#71C3FF")
            .addFields({ name: '1️⃣ci!関連', value: `ci!関連のコマンド一覧を表示するよ！`, inline: true }, { name: '2️⃣クレジット', value: `クレジットを表示するよ！`, inline: true })
          message.channel.send({ embeds: [help] });
          const filter = (msg) => msg.author.id === message.author.id;
          const collected = await message.channel.awaitMessages({ filter, max: 1, time: 100000 });
          const response = collected.first();
          if (["1"].includes(response.content)) {
            const help = new MessageEmbed()
              .setTitle("へるぷ一覧！")
              .addFields({ name: 'ci!ping', value: '> pingを返すよ！' },
                         { name: 'ci!dayn', value: '> 今日pingしたか確認で確認できるよ！' },
                         { name: 'ci!shu', value: '> URLを短縮するよ！' },
                         { name: 'ci!time', value: '> 現在時刻（日本時間）を返すよ！' },
                         { name: 'ci!ava', value: '> あなたのアイコンを返すよ！' },
                         { name: 'ci!ram', value: '> ”あたい最強”を並び替えて返すよ！' },
                         { name: 'ci!emoji', value: '> 絵文字を返すよ！' },
                         { name: 'ci!omi', value: '> おみくじができるよ！' },
                         { name: 'ci!lvs', value: '> レベルを確認できるよ！(レベル表はこちらhttps://bit.ly/3iB3Di1)' },
                         { name: 'ci!icoc', value: '> アイコンの色の枠を変更できるよ！（16進数カラーコード専）(25円必要)' },
                         { name: 'ci!okz', value: '> 巫女さんからおこずかいをもらえるよ！' },
                         { name: 'ci!trophy', value: '> 今持っている実績を確認するよ！' },
                         { name: 'ci!ranking', value: '> ランキングがみれるよ！ <lv|wallet>' },
                         { name: 'ci!obr', value: '> オカルトボールが錬成できるよ！' },
                         { name: 'ci!bag', value: '> 持ち物が確認できるよ！' },)
              .setColor("#71C3FF")
              .setTimestamp();
            message.channel.send({ embeds: [help] });
          } else if (["2"].includes(response.content)) {
            const help = new MessageEmbed()
              .setTitle("クレジット")
              .setColor("#71C3FF")
              .setThumbnail('https://cdn.glitch.global/ae7cadfc-5cb5-478c-98dd-7cd26b665238/ti1.png?v=1669449827478')
              .addFields({ name: 'イラスト', value: '> Minntelia' },
                         { name: 'コード', value: '> Minntelia' },
                         { name: '協力', value: '> 東の国の雑談鯖' },
                         { name: 'サイト', value: '> glitch \n> Google Apps Script \n> github' },
                         { name: 'その他', value: '> Discord.js V13' },
                         { name: '監督', value: '> Minntelia' },)
            message.channel.send({ embeds: [help] });
          } return;
        } 
      };
     if (message.content === "ci!omi") {
       var array = [
        "**大ちゃん！** \nだいすき！",
        "**るーみあ！** \nそーなのかー",
        "**ちるの！** \nあたい！",
        "**れいむ！**　\nみこ！",
        "**みすちー！**　\nだいすき！",
      ];
      message.channel.send(array[Math.floor(Math.random() * array.length)]);
      return;
    }
     if (message.content === "ci!emozi") {
      var array = [
       "<:tiruno:902871696321695784>",
       "<:tiruno:977461160741863434>",
       "<:tiruno:1008336651736584273>",
       "<:tiruno:956320449548140554>",
       "<:tiruno:1011914774998679552>",
       "<:tiruno:1027697022964342784>",
       "<:tiruno:1027699022170963979>",
       "<:tiruno:1048900273692753991>",
       "<:tiruno:1013360258099466280>",
      ];
      message.channel.send(array[Math.floor(Math.random() * array.length)]);
      return;
    }
     if (message.content === "ci!ram") {
      var len = 5;
      var str = "あたい最強";
      var strLen = str.length;
      var result = "";
      for (var i = 0; i < len; i++) {
        result += str[Math.floor(Math.random() * strLen)];
        console.log(result);
        if (result.length >= 5) {
          console.log(result);
          message.channel.send(result);
          return;
        }
      }
    }
     if (message.content === "ci!ava") {
      message.reply(
        "あなたのアバターだよ！" + message.author.displayAvatarURL()
      );
      return;
    }
     if (message.content.startsWith("ci!shu")) {
      const aarsd = message.content.split(" ").slice(1).join(" ");
      if (!aarsd)
        return message.channel.send("空白がないまたは入力されていないよ！");
      isgd.shorten(aarsd, function (res) {
        const embed = new MessageEmbed();
        message.delete();
        message.channel.send("短縮せいこう！\n> " + res);
      });
    }
     if (message.content === "ci!time") {
      const FORMAT = "**__YYYY年MM月DD日 HH時mm分ss秒__**";
      const now = new Date();
      message.reply(
        "いまは" +
          formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO }) +
          "（日本時間）だよ！"
      );
      return;
    }
     if (message.content === "ci!okz") {
    const day = (await pings.get(message.author.id)) || { count_okz: 0 };
    const items = (await item.get(message.author.id)) || { osai_sen: 0 };
    if (day.count_okz >= 1) {
      message.reply("<:LEIMU:1050380598994272277>＜もうおこずかいはあげたわよ。");
      return;
    } else {
      var min = 50;
      var max = 250;
      var sai = Math.floor(Math.random() * (max + 1 - min)) + min;
      items.osai_sen -= 0;
      items.osai_sen += sai * 1;
      day.count_okz += 1;
      pings.set(message.author.id, day);
      item.set(message.author.id, items);
      message.reply(`<:LEIMU:1050382917790072862>＜今日のおこずかいは${sai}円よ。（現在のあなたの所持金${items.osai_sen}円）`);
      if (items.osai_sen >= 1000000 && trophy.dfg == false){
        message.reply(`<:LEIMU:1050380598994272277>＜...あら。貴方今回のおこずかいで100万円超えたみたいね。（現在のあなたの所持金${items.osai_sen}円）\n　　今私の神社でキャンペーンやってるのよね。100万円超えたらトロフィーあげるっていう`);
        message.reply(`<:LEIMU:1050380598994272277>＜はい、トロフィーよ。`);
        trophy.dfg = true;
        message.reply(`実績解除！【大富豪】`);
        trophys.set(message.author.id, trophy);
      }
      if (items.osai_sen >= 100000000 && trophy.cfg == false){
        message.reply(`<:LEIMU:1050380598994272277>＜...あら。貴方今回のおこずかいで1億円超えたみたいね。（現在のあなたの所持金${items.osai_sen}円）\n　　今私の神社でキャンペーンやってるのよね。1億円超えたらトロフィーあげるっていう`);
        message.reply(`<:LEIMU:1050380598994272277>＜はい、トロフィーよ。`);
        trophy.cfg = true;
        message.reply(`実績解除！【超富豪】`);
        trophys.set(message.author.id, trophy);
      }
      return;
    }
  }
     if (message.content === "ci!dreal") {
    if (message.author.id !== "811186190707195906")return message.reply("...?");
    const day = pings.get(client.users.cache.get) || { count: 0, count_okz: 0 };
    pings.clear();
    console.log(`reset ok`);
    return;
  } 
     if (message.content.startsWith("ci!dre")) {
    if (message.author.id !== "811186190707195906")return message.reply("...?");
    const uid = message.content.split(" ").slice(1).join(" ");
    if (!uid) return message.channel.send("ci!dre [id]");
    var num_u = uid;
    if(!isNaN(num_u)){
      const items = (await item.get(message.author.id)) || { osai_sen: 0 };
      const day = pings.get(uid) || { count: 0, count_okz: 0 };
      day.count = 0;
      day.count_okz = 0;
      pings.set(uid, day);
      // items.osai_sen = 0;
      // item.set(uid, items);
      message.channel.send("reset ok");
      return;
    } else {
    message.channel.send("数字を入力してね！");
     return;
    }
  } 
     if (message.content === "ci!dayn") {
    const day = (await pings.get(message.author.id)) || { count: 0 };
    if (day.count >= 1) return message.reply("今日はもうやったよー");
    message.reply("今日はまだやってないよー");
  }　   
     if (message.content.startsWith("ci!osa_s")) {
    if (message.author.id !== "811186190707195906")return message.reply("...?");
    const uid = message.content.split(" ").slice(1,2).join(" ");
    const nan = message.content.split(" ").slice(2).join(" ");
    if (!uid || !nan) return message.channel.send("ci!osa_s [id] [nan]");
    var num_u = uid;
    var num_n = nan;
    if(!isNaN(num_u) || !isNaN(num_n)){
    const items = (await item.get(uid)) || { osai_sen: 0 };
    items.osai_sen = nan; 
    item.set(uid, items);
    message.channel.send('ID:' + uid +'変更後金額:' +nan);
  } else {
    message.channel.send("数字を入力してね！");
  }
    }
     if (message.content.startsWith("ci!obr")) {
       const items = (await item.get(message.author.id)) || { osai_sen: 0, okabo: 0, obr_nan: 0, rensei: false };
       const ren = (await rensei.get(message.author.id)) || { rensei: false, lasttime: "" };
       var ser = message.content.split(" ").slice(1,2).join(" ");
       if (ser == ""){
         message.channel.send("**オカボ錬成術使用方法使用方法**\n・オカボ錬成は1個5000円/3時間だよ\nci!obr：今見てるよ\nci!obr cre [個数]：個数に作りたい数入れてね！\nci!obr coll：錬成完了したものが受け取れるよ！");
       }
       if (ser == "cre"){
         if (!items.okabo) { items.okabo = 0; item.set(message.author.id, items); }
         if (ren.rensei == true) {message.channel.send(`現在錬成中！\n（錬成開始時間:${ren.lasttime}\n完成予定時間↑から${3 * items.obr_nan}時間後）`);return;}
         if (items.rensei == true) {message.channel.send(`錬成が完了したものがあるよ！**ci!abr coll**で受け取ろう！`);return;}
         var cre = message.content.split(" ").slice(2).join(" ");
         if (cre == "") {message.channel.send("個数を入力してね！");return;}
         if(isNaN(cre)) {message.channel.send("英半角で個数を入力してね！");return;}
         if(items.osai_sen <= 5000 * cre){message.channel.send("おこずかいが足りないよ～");return;}
         message.channel.send(`> 錬成個数:**${cre}**個, 錬成時間:**${3 * cre}**時間, 値段:**${5000 * cre}**です。
                               > 所持金:**${items.osai_sen}**, オカボ:**${items.okabo}**` +
                               `\n錬成しますか？("錬成"と入力すると錬成開始)`);
         const filter = (msg) => msg.author.id === message.author.id;
         const collected = await message.channel.awaitMessages({ filter, max: 1, time: 20000 });
         const response = collected.first();
         if (!response) return message.channel.send("錬成をキャンセルしたよ");
         if (!["錬成"].includes(response.content)) return message.channel.send("錬成をキャンセルしたよ");
         ren.rensei = true;
         items.rensei = true;
         ren.lasttime = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
         items.osai_sen -= 5000 * cre
         items.obr_nan = cre
         let obrtime = 3600000 * cre
         item.set(message.author.id, items);
         rensei.set(message.author.id, ren, obrtime);
         message.channel.send(`錬成開始！**${3 * items.obr_nan}**時間後にci!obr collをしよう！`);
       } 
       if (ser == "coll"){
         console.log(items.rensei);
         if (ren.rensei == true) {message.channel.send(`現在錬成中！\n（錬成開始時間:${ren.lasttime}\n完成予定時間↑から${3 * items.obr_nan}時間後）`);return;}
         if (ren.rensei == "" || ren.rensei == false || !ren.rensei ) {
           if (items.rensei == false){message.channel.send(`現在錬成中のものはないよ！`);return;}
           if (items.rensei == true){
             items.okabo = parseFloat(items.okabo)
             items.okabo += parseFloat(items.obr_nan)
             message.channel.send(`錬成完了！オカボを**${items.obr_nan}**個手に入れた！(現在**${items.okabo}**個)`);
             items.obr_nan = 0
             items.rensei = false;
             item.set(message.author.id, items);
           }
         }
       }
       if (ser == "admin"){
         if (message.author.id !== "811186190707195906")return;
         var set = message.content.split(" ").slice(2,3).join(" ");
         var boo = message.content.split(" ").slice(3,4).join(" "); // true, falseまたはid
         if (set == "item"){
           if (boo == "true"){
             items.rensei = true;
             console.log(items.rensei);
             item.set(message.author.id, items);
           }
           if (boo == "false"){
             items.rensei = false;
             console.log(items.rensei);
             item.set(message.author.id, items);
           }
         }
         if (set == "ren"){　
           var nab = message.content.split(" ").slice(4).join(" ");
           const ren = (await rensei.get(message.author.id)) || { rensei: false, lasttime: "" };
           if (nab == "true"){
             ren.rensei = true;
             console.log(ren.rensei);
             rensei.set(boo, ren);
           }
           if (nab == "false"){
             ren.rensei = false;
             console.log(ren.rensei);
             rensei.set(boo, ren);
           }
         }
         if (set == "add"){
           const items = (await item.get(boo)) || { osai_sen: 0, okabo: 0, obr_nan: 0, rensei: false};
           var nab = message.content.split(" ").slice(4).join(" ");
           items.okabo = nab
           console.log(items.okabo);
           item.set(boo, items);
         }
         if (ser == "re"){
           items.okabo = 0
           console.log("reset");
           item.set(message.author.id, items);
       }
       }
     }
     if (message.content.startsWith("ci!s-cn")) {
       const items = (await item.get(message.author.id)) || { osai_sen: 0, okabo: 0, obr_nan: 0, rensei: false };
       const ives = (await ive.get(message.author.id)) || { majin : false, ives: "", sid: ""};
       var key = message.content.split(" ").slice(1,2).join(" ");
       if (key == "説明"){
         message.channel.send(`📓
         召喚方法...合言葉を言いけりさすれば貴様の前にあらわれり...
         合言葉は機械を統べるものがしりえり...
         さして世に広め皆が使えるようになるだろう...`);
       }
       if (key == "バグった"){
         message.channel.send(`あ`);
         ives.majin = false
         ive.set(message.author.id, ives);
       }
       if (key == "クロワッサンたべたぁぁぁい！！"){
         ives.sid = message.author.id;
         if (ives.majin == 2) {
           var m = await message.channel.send('<:emoji_9:1073960190728208464><**ちょっと待て、すでに目の前におるじゃろう**')
           await setTimeout(3000);
           m.delete()
           return;
         }
         if (ives.majin == 1) {
           var m = await message.channel.send('現在召喚ちゅうであろう...')
           await setTimeout(2000);
           m.delete()
           return;
         }
         const msg = await message.channel.send('...')
         ives.majin = 1
         ive.set(message.author.id, ives);
         await setTimeout(1000);
         await msg.edit('....!!');
         await setTimeout(1000);
         await msg.edit('ゴゴゴゴゴゴゴ(効果音)');
         await setTimeout(3000);
         await msg.edit("ポン！(効果音)");
         await setTimeout(1000);
         await msg.edit("☁☁シュワアァァァｧｧｧ...(効果音)");
         await setTimeout(3000);
         if (items.okabo <= 7){
           await msg.edit("...??");
           await setTimeout(2000);
           await msg.edit("何も起こらなかった...");
           await msg.delete();
           return;
         }
         await msg.edit("<:Majin:1073957498861666375> **ドン！**(効果音)");
         ives.majin = 2
         ive.set(message.author.id, ives);
         await setTimeout(2000);
         await msg.edit("<:Majin:1073957498861666375><**我は願いをかなえる者なり**");
         await setTimeout(2000);
         await msg.edit("<:Majin:1073957498861666375><**貴様は何を望むか？**");
         await setTimeout(500);
         ives.ives = msg.id;
         console.log(msg.id);
         console.log(ives.majin);
         ive.set(message.author.id, ives);
         
         
         const buttons = [
           new MessageButton() .setCustomId("XP") .setStyle("PRIMARY") .setLabel("XPが欲しい"),
           new MessageButton() .setCustomId("wait") .setStyle("SUCCESS") .setLabel("ちょっとタンマ")
         ]
         await msg.edit({ content: "<:Majin:1073957498861666375> 貴様は何を望むか？", components: [new MessageActionRow().addComponents(buttons)]});
       }
     }
     if (message.content === "ci!bag"){
       const items = (await item.get(message.author.id)) || { osai_sen: 0, okabo: 0, obr_nan: 0, waku_change: 0 };
       const itembag = new MessageEmbed()
       .setTitle("持ち物")
       .setColor("#71C3FF")
       .addFields({ name: '所持金', value: `> ${items.osai_sen}円`, inline: true },
                  { name: 'アイコン枠券', value: `> ${items.waku_change}枚`, inline: true },
                  { name: 'オカルトボール', value: `> ${items.okabo}個`, inline: true })

       message.channel.send({ embeds: [itembag] });
     }
     if (message.content.match(/おはようございます|おはよう/)) {
      const now = new Date();
      const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
      console.log(time);
      if (6 <= time && time <= 11) {
        var array = [
          "(｡・∀・)おはよー！",
          "٩(ˊᗜˋ*)وおっはよーう！",
          "おはよう！今日は何して遊ぶ？",
          "<:emoji_27:1013360258099466280>",
        ];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
        return;
      }
    }
     if (message.content.match(/こんにちは|こんちゃ/)) {
      const now = new Date();
      const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
      console.log(time);
      if (12 <= time && time <= 16) {
        var array = ["あそぼー！"];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
        return;
      }
    }
     if (message.content.match(/こんばんは/)) {
      const now = new Date();
      const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
      console.log(time);
      if (17 <= time && time <= 23) {
        var array = [
          "こんばんは！眠たくなってきたね...(*ᴗ₄ᴗ)⁾⁾ ﾊｯ!? 寝てないよ！？(； ・`ω・´)",
          "( ˘ω˘ ) ｽﾔｧ…",
        ];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
        return;
      }
    }
  });
  client.on('interactionCreate', async (interaction) => {
    if (interaction.customId === "wait") {
       const ives = (await ive.get(interaction.user.id)) || { majin : false, ives: "", sid: ""};
       if (ives.sid !== interaction.user.id){
         await interaction.reply({ content: `<:emoji_9:1073960190728208464><**ちょっと待て、召喚したのは貴様じゃなかろう**`, ephemeral: true });
         return;
       }
       const buttons = [
                        new MessageButton() .setCustomId("wait") .setStyle("SUCCESS") .setLabel("ちょっとタンマ") .setDisabled(true)
                       ]
       const msg = await interaction.update({ content: `<:majin4:1073960028748394628> 承知した。決まったら呼ぶがよい。`, components: [new MessageActionRow().addComponents(buttons)]})
       await setTimeout(1000);
       await interaction.message.delete();
       ives.majin = false
       ives.sid　= ""
       ive.set(interaction.user.id, ives);
     }
    if (interaction.customId === "XP") {
      var sid = interaction.guild.id
      const items = (await item.get(interaction.user.id)) || { osai_sen: 0, okabo: 0, obr_nan: 0, rensei: false };
      const ives = (await ive.get(interaction.user.id)) || { majin : false, ives: "", sid: ""};
      const xs = (await xps.get(interaction.user.id))|| { [sid]: 0 }
       if (ives.sid !== interaction.user.id){
         await interaction.reply({ content: `<:emoji_9:1073960190728208464><**ちょっと待て、召喚したのは貴様じゃなかろう**`, ephemeral: true });
         return;
       }
      const buttons = [
                       new MessageButton() .setCustomId("XP") .setStyle("PRIMARY") .setLabel("XPが欲しい") .setDisabled(true)
                      ]
      const msg = await interaction.update({ content: `<:majin4:1073960028748394628><**承知した。ではXPを付与しよう
      ...(省略)
      付与したぞ。ではさらばだ。**`, components: [new MessageActionRow().addComponents(buttons)]})
      await setTimeout(3000);
      await interaction.message.delete();
      xs[sid] += 7500 * 1;
      items.okabo -= 7;
      ives.majin = false
      ives.sid　= ""
      item.set(interaction.user.id, items);
      xps.set(interaction.user.id, xs);
      ive.set(interaction.user.id, ives);
      return;
    }
  });
};
exports.randomplay = function () {};

client.login(process.env.DISCORD_BOT_TOKEN);
