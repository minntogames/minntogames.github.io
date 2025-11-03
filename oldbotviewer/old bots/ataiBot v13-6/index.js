const {
  Client,
  Intents,
  Collection,
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
  Modal,
  ModalBuilder,
 	TextInputComponent,
 	TextInputStyle,
  MessageSelectMenu,
  GatewayIntentBits,
  AttachmentBuilder,
  PermissionsBitField,
  ThreadManager,
  Events,
  Guilds,
  Discord,
} = require("discord.js");
const { joinVoiceChannel, entersState, VoiceConnectionStatus, createAudioResource, StreamType, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, generateDependencyReport, getVoiceConnection, AudioResource } = require("@discordjs/voice");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES, "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES",],
});
const { v4: uuidv4 } = require('uuid');
const helping = require('./commands.json');
const buff = require('./buffs.js');
const buffjson = require('./buff.json');
const moment = require('moment-timezone');
      moment.tz.setDefault('Asia/Tokyo'); // タイムゾーンを日本に設定
const cron = require('node-cron');
client.setMaxListeners(0);
const fs = require("fs");
const express = require("express")
const app = express();
const port = 3000;
app.use(express.static(__dirname + '/views'));
app.set("view engine", "ejs");

const bodyParser = require('body-parser');

const pingchannel = "1320735224912543754"; //特定のチャンネルで反応
const pingmsg = "1117469217252454511"; //送信チャンネル
const cirno = require("./chara.json")
const datas = require("./mongoget.js");
const mmov = require("./genso.js");
const Gimg = require("./getimg.js");
const owner = ["811186190707195906", "613769723514978305", "830570869742764062"]//自分　ピカチュウ　氷結の順

const { google } = require('googleapis');

const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "YYYY-HH:mm:ss";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();
const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });

const shstnum = 10
const shstfor = 6
const lvupNotice = "1324400770929659998"

const April = false

const dailyTasks = [
  { id: 1, name: '探索を行う！', description: '探索(`cio!shst`)に行かせて返ってきたら課題完了になります' },//
  { id: 2, name: 'ランクカードを確認する！', description: 'ランクカード(`cio!level`)を確認しよう' },//
  { id: 3, name: 'helpを実行しよう！', description: 'たまには初心に帰ってコマンドのつかいかたを覚えると良いですよ' },//
  { id: 4, name: 'mapを実行しよう！', description: 'マップってなんかいいよね' },//
  { id: 6, name: 'ログインボーナスを受け取ろう！', description: 'ログボって完全じゃないんですよね' },//
  { id: 7, name: 'ランキングを見よう！', description: 'cio!rankingを実行しよう' },//
  { id: 8, name: 'グラフを見よう！', description: 'cio!grafを実行しよう' },//
  { id: 9, name: 'ユーザー情報を見よう！', description: 'cio!userを実行しよう' },//
  { id: 10, name: 'ステータスを見よう！', description: '万能系のものだよん' },//
  { id: 11, name: 'チルノちゃんとじゃんけんをしよう！', description: 'ははは、楽しけりゃそれでいいってもんだ' },//
  { id: 12, name: 'アイテムを売ろう！', description: 'なんでも買い取ってくれる(一部除く)(/ci-item-sell)' },//
  { id: 13, name: 'アイテムを買おう！', description: 'こーりんはなぜ石ころを売っているのだろうか(哲学)(/ci-item-buy)' },//
];

const https = require('https');
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
          console.log(`==== google Script ====`);
          res.end();
          return;
        }
        res.end();
      });
    } else if (req.method == "GET") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Login");
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
  console.log(`==== Logged in: ${client.user.tag} ====`);
  client.user.setActivity("あたいってさいきょー！！！：cio!help");
  const data = []
  for (const commandName in commands) {
        data.push(commands[commandName].data)
    }
   await client.application.commands.set(data);
    console.log("slash command read success!\nReady?");
});
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
            content: 'コマンドの実行に失敗しました...(´・ω・`)',
            ephemeral: true,
        })
    }
});

//daydata
const serverId = '1021038709132492841'; // 対象のサーバーのID
const channelId = '1112562334314008596'; // メッセージを送信するチャンネルのID
cron.schedule('0 0 * * *', async () => { // 日本時間の0時に実行
  console.log("実行開始")
  const guild = client.guilds.cache.get(serverId)
  console.log("実行1")
  const members = await guild.members.fetch();
  const users = members.filter((member) => !member.user.bot);
  const userStats = [];

  // Day Data Reset
  for (const [memberId, member] of users) {
    const user = member.user;
    const userId = user.id;
    const users = await datas.get("day", userId)
    users.data.ping_day = 0
    users.data.shst_day = 0
    users.data.login_day = 0
    users.data.task = []
    await datas.save(users, userId)
  }
  // Task set
  const tas = await datas.get("day", 'task')
  tas.data.task = []
  tas.data.buy = []
  tas.data.task = getRandomTasks(3)
  const items = await SetRandomBuy(40)
  tas.data.buy = items
  tas.data.img = 0
  console.log(tas.data.task);
  await datas.save(tas, 'task');
  
  const data = await datas.get("daydata", serverId); // サーバーごとのデータを取得
  if (!data) return; // データが存在しない場合は何もしない
  const day = new MessageEmbed()   
    .setTitle(`**${moment().format('YYYY/MM/DD')} の統計データ**\n`)
  const goukei = { count: 0, chars: 0 }
    for (let hour = 0; hour < 24; hour++) {
      const hourData = data.data[hour];
      if (!hourData) continue; // データが存在しない場合はスキップ
      day.addFields({ name:`**${hour}時:**`, value: `**${hourData.count}**件 / **${hourData.chars}**文字`, inline: true})
      goukei.count += hourData.count
      goukei.chars += hourData.chars
    }
  day.addFields({ name:`**合計:**`, value: `**${goukei.count}**件 / **${goukei.chars}**文字`})
  const channel = await client.channels.fetch(channelId);
  await channel.send({ embeds: [day] });
  data.data = null
  await datas.save(data, serverId); // データをリセット
   console.log("実行完了")
  }, {
    timezone: 'Asia/Tokyo'
  });

cron.schedule('0 6,12,18 * * *', async () => { // 日本時間の0時に実行
  console.log("ラインナップ更新開始")
  const tas = await datas.get("day", 'task')
  tas.data.buy = []
  const items = await SetRandomBuy(40)
  tas.data.buy = items
  console.log(tas.data.buy);
  await datas.save(tas, 'task');
  console.log("更新完了")
}, {
  timezone: 'Asia/Tokyo'
});

cron.schedule('0 0 0 * * 1', async () => { // 日本時間の0時に実行
  console.log("実行開始")
  const tas = await datas.get("day", 'task')
  tas.data.huku = [
    { value: 75000, na: "5等" },  
    { value: 20000, na: "4等" },  
    { value: 4000, na: "3等" },   
    { value: 999, na: "2等" },    
    { value: 1, na: "1等" }       
  ];
  await datas.save(tas, 'task');
  const channel = await client.channels.fetch("1127157210707927103");
  await channel.send("完了");
  console.log("実行完了")
  }, {
    timezone: 'Asia/Tokyo'
  });

client.on('messageCreate', async (message) => {
    if (message.guildId !== serverId) return; // 対象のサーバーでない場合は何もしない
    if (message.system || message.author.bot) return; // システムメッセージ、またはBotの場合は何もしない
    const hour = moment().hour(); // 現在の時刻を取得
    const data = await datas.get("daydata", serverId) // サーバーごとのデータを取得
    if (!data.data) { // データが存在しない場合は初期化
      data.data = {};
      for (let i = 0; i < 24; i++) {
        data.data[i] = {
          count: 0,
          chars: 0
      };
    }
  }
  // データを更新
  data.data[hour].count++;
  data.data[hour].chars += message.content.length;
  await datas.save(data, serverId);
 });
//login
client.on('messageCreate', async (message) => {
    if (message.content === 'cio!login') {
      
      const s = await datas.get("day", message.author.id) 
      const bag = await datas.get("bag", message.author.id) 
      const Cirno = await datas.get("user", message.author.id) 
      
      if (s.data.login_day >= 1) {
        if(April == true) { //エイプリルフール
          return message.reply("もうログボはもらってるよ～？もしかしてよくばりさんなのかな～？");
        }
        return message.reply("今日のログインボーナスはもうもらったよ〜");
      }
      
      const LoginNowDate = new Date();
      let Now = new Date(LoginNowDate.getTime() + (9 * 60 * 60 * 1000)); // 9時間をミリ秒単位で加算
      if (!Cirno.data.login || !Cirno.data.login.lastLoginDate) {
        Cirno.data.login = { 
          "bairitu": 0, 
          "lastLoginDate": "" 
        }
        await datas.save(Cirno, message.author.id);
      }
      const LastLoginDate = new Date(Cirno.data.login.lastLoginDate)|| null
      let Last
      if (LastLoginDate) {
        Last = new Date(LoginNowDate.getTime() + (9 * 60 * 60 * 1000));
      }
      
      if (!Cirno.data.login.bairitu) {
        Cirno.data.login.bairitu = 0.9
        console.log("倍率初期設定完了"); 
      } else if (!LastLoginDate || isTwoDaysApart(Now, Last) === true){     
        Cirno.data.login.bairitu = 0.9
        if(April == true) { //エイプリルフール
          message.reply("連続記録記録切れちゃったねー、あはっ、ドンマ～イ");
        } else {
          message.reply("ボーナス倍率がリセットされました...");
        }
        console.log("倍率リセット完了");
      }
      
      if (Cirno.data.login.bairitu <= 10)Cirno.data.login.bairitu += 0.1
      
      Cirno.data.login.lastLoginDate = LoginNowDate
      
      var max = Math.floor(200 * Cirno.data.login.bairitu)
      console.log(max);
      const nums = Math.floor(Math.random() * (max - 50 + 2)) + 1;
      
      var existingItem = bag.data.items.find(function(item) {
        return item.item.itemid === 10000000;
      });
      
      let login_text = "ログイン！"
      if(message.author.id !== "811186190707195906" || April == true) login_text = "こんにちは～♡"//エイプリルフール
      let a = Cirno.data.login.bairitu;
      const embed = new MessageEmbed()
      .setTitle("ログイン！")
      .addFields({ name: 'おこずかい', value: nums + `円\n(${existingItem.item.num}円 → ${existingItem.item.num+=nums}円)`  },
                 { name: '倍率', value: `x` + a.toFixed(1) + `${a <= 10 ? "" : "(**MAX!**)"}`})
      
      if (nums <= 100 && April == true) embed.setFooter({ text: 'おこずかい100円以下？？ざっこ～い笑' });//エイプリルフール

      if (existingItem) {
        existingItem.item.num += nums;
      } else {
        var newItem = {
          "itemid": 10000000,
          "num": nums
        };
        bag.data.items.push({ item: newItem });
      }　

      message.reply({ embeds: [embed] });
      
      if(!Cirno.data.chara.User.TotalAction.numLogin) Cirno.data.chara.User.TotalAction.numLogin = 1
      Cirno.data.chara.User.TotalAction.numLogin++
      
      s.data.login_day = 1
      
      await datas.save(s, message.author.id);
      await datas.save(bag, message.author.id);
      await datas.save(Cirno, message.author.id);
      
      tasksetting(6, message.author.id, message)
    }
  });
//ping
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  let ping = Date.now() - message.createdTimestamp;
  const authorId = message.author.id;
  const s = await datas.get("day", message.author.id) 
  const bag = await datas.get("bag", message.author.id) 
  const Cirno = await datas.get("user", message.author.id) 

  if (message.content === 'cio!ping') {
    if (message.channel.id === pingchannel && s.data.ping_day >= 1) {
      if(April == true) { //エイプリルフール
        return message.reply("もうPingしてるよ～？もしかしてせっかちさんなのかな～？");
      }
      return message.reply("今日はもうやったよー");
    }
    let pings = await mmov.pingstop(message.author.id) || { ping: false };
    console.log(pings)
    if (s.data.ifping == true) {
      message.reply("いまはPingできないよ！またやってみてね！");
      s.data.ifping = false
      await datas.save(s, message.author.id)
      return
    }
    
    let text = `あなたの送信速度は\`${ping} ms\`よ！`
    if(April == true) { //エイプリルフール
      text = `あんたの送信速度は\`${ping} ms\`よ！`
    }

    message.reply(text);

    if (ping >= 300) {
      handlePing(300, Cirno.data.setting.ping.threeping, message.author.tag);
    } else if (ping >= 200) {
      handlePing(200, Cirno.data.setting.ping.twoping, message.author.tag);
    }　else if (ping >= 100) {
      handlePing(100, Cirno.data.setting.ping.twoping, message.author.tag);
    }

    if (Cirno.data.setting.ping.maxping <= ping || !Cirno.data.setting.ping.maxping) {
      Cirno.data.setting.ping.maxping = ping;
    }

    if (message.channel.id === pingchannel) s.data.ping_day = 1;
    if (message.channel.id === pingchannel) Cirno.data.chara.User.TotalAction.numPing++
    await datas.save(Cirno, authorId);
    await datas.save(s, authorId);
  }

   async function handlePing(threshold, pingCounter, authorTag) {
    let text = `ping値**\`${threshold}\`**超え！`
    if(April == true) { //エイプリルフール
      text = `ping値**\`${threshold}\`**超え～♡`
    }
    
    message.reply(text);
    
    if (message.channel.id === pingchannel) {
      const embed = new MessageEmbed()
        .setTitle(`${message.author}\n${threshold}Pingのお知らせ`)
        .addFields(
          { name: 'ユーザー名', value: `> ${authorTag}` },
          { name: 'PING値', value: `> ${ping}`, inline: true },
          { name: `${threshold}ping合計`, value: `> ${pingCounter + 1}`, inline: true }
        )
        .setColor("#71C3FF")
        .setTimestamp();
      
      client.channels.cache.get(pingmsg).send({ embeds: [embed] });
      let id 
      if (threshold == 300 || threshold == 200) {
        id = 10000009
      } else {
        id = 10000011
      }
      
      const existingItem = bag.data.items.find(item => item.item.itemid === id);
      if (existingItem) {
        existingItem.item.num ++;
      } else {
        const newItem = {
          itemid: id,
          num: 1,
        };
        bag.data.items.push({ item: newItem });
      }


      if (threshold == 300) {
        Cirno.data.setting.ping.threeping++;
        Cirno.data.chara.lv.giveXp.max += 1;
        if(April == true) { //エイプリルフール
          message.reply(`${threshold}ping...おっそーい♡`);
    　　}
      } else if (threshold == 200) {
        if(April == true) { //エイプリルフール
          message.reply(`${threshold}ping...おっそ♡`);
          message.reply(`かわいそうだからあいてむあげる♡気を落とさないでね♡`);
    　　}
        Cirno.data.setting.ping.twoping++;
        message.reply("そしてさいきょう玉を一つ手に入れた！");
        Cirno.data.chara.lv.giveXp.max += 1;
      }　else if (threshold == 100) {
        message.reply("100ping！光るかけらを1つ手に入れた！");
      }
      
      await datas.save(Cirno, authorId);
      await datas.save(bag, authorId);
    }
  }
});
//shst・bag
const timers = {};
const bagsetting = {};
module.exports.timer = async function(id) {
  return timers[id];
}
client.on('messageCreate', async message => {
  // 取得
  const s = await datas.get("day", message.author.id) 
  const bag = await datas.get("bag", message.author.id) 
  const Cirno = await datas.get("user", message.author.id) 
  if (message.content === 'cio!shst') {
    // if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    let stim = await mmov.timer(message.author.id) || { moveing: false }
    if (stim.moveing == true)return message.reply(`チルノは今${stim.name}へ移動中です。`);
    if (s.data.shst_day >= shstnum) {　
      if(April == true) { //エイプリルフール
        return message.reply(`ちょっ...つかれてるのよ？`);
      }
      return message.reply('疲れてもうあるけないよー...');
  　}
    
  　if (!Cirno.data.map.mapid || Cirno.data.map.mapid == null) return message.reply('ここは探索できません。別の地域に移動してください。');
  　// if (message.guildId === "1100357395244404756") return 
    // タイマーがすでにオンになっている場合、アラートを送信して終了
    if (timers[message.author.id]) {
      return message.reply(`たんさく中だよ！(探索終了：${timers[message.author.id].date})`);
    }
    
    const str = []　// タイマーIDを生成
    const timerId = uuidv4();　
    let time = 1800000; // タイマーの時間（ミリ秒単位）を設定 1800000 (30分)
    let bt = []
    
    let bufff = Cirno.data.buff || []
    if(bufff.length >= 1){
      for (let i of Cirno.data.buff){
        switch(i.id){
          case 1:

            let buffoption = await buff.buff(i.id, time)
            time = buffoption
            
            let filteredArray 

            const existingItem = Cirno.data.buff.find(function(item) {
              return item.id === i.id;
            });
            existingItem.duration--
            
            if(existingItem.duration <= 0){
              filteredArray = Cirno.data.buff.filter(obj => obj.id !== i.id);
            }

            Cirno.data.buff = filteredArray
            let to = convertMillisecondsToHMS(time);
            bt.push(`**${i.name}**の効果で探索時間が${to.hours}時間${to.minutes}分${to.seconds}秒になった！`)
            if(buffoption >= 1800000 &&  April == true) { //エイプリルフール
              bt.push(`運よわよわじゃ～ん♡`);
            }
            break;
        }
      }
      if (bt.length >= 1){
        message.reply(bt.join("\n"));
      }
    }
    // console.log(time)
    
    // タイマーの処理
    const timeObject = convertMillisecondsToHMS(time);
    const jatime = displayCombinedTime(timeObject);
    // 3分刻みの時間の配列を生成
    const timeArray = generateTimeArray();

    // 配列の内容を表示
    // console.log(timeArray);
    let text = `たんさく開始！\n(多分${jatime}に探索完了)`
    if(April == true) { //エイプリルフール
      text = `たんさく開始～♡\n(多分${jatime}に探索完了)`
    }
    message.reply(text);
    
    const timer = setTimeout(() => {
      console.log("探索完了")
      const LocationData = searchMapData(Cirno.data.map.mapid)
      let itemData = require('./items.json');
      
      const itemtable = getItemsByCode(LocationData.item)
      const rareitemtable = getItemsByCode(LocationData.rareitem)
      
      let rare = null
      let drop = null
      let num = { max: 0, min:0 }
      let array = []
      const randomValue = Math.random();
      if (randomValue <= LocationData.weight) {
        array = itemtable.concat(rareitemtable);
        rare = true
      } else {
        array = itemtable
        rare = false
      }
      
      const newItems = array
      console.log(rare)
      const itemKeys = Array.from(newItems.keys());
      
      //(message, itemKeys, newItems, LocationData, num, drop)
      const lv = levelcount(message,itemKeys,newItems,LocationData,num,drop,str)
      .then(result => {
        str.push(result) 
        if(drop == true) {
          str.push(`([1;33m今回は持ち帰った量が増えてるかも？[0m)`) 
        }
        if(rare == true) {
          str.push(`([1;33m今回はいいものを持ち帰ったかも？[0m)`) 
        }
        console.log(str);
        const d = s.data.shst_day == null ? "0": s.data.shst_day
        
        let text = `${message.member.displayName ?? message.author.username}ー、たんさくおわったよ！\n確認しにきてね！`
        if(April == true) { //エイプリルフール
          text = `${message.member.displayName ?? message.author.username}～♡、たんさくおわったよ？\n確認しにきてね♡`
        }
        
        message.reply(text)
        message.channel.send("```ansi\n" +`${str.join("\n")}` + "```" + `を見つけたよ！\n(残り探索可能回数：${shstnum - d - 1}回)`);})
      .catch(error => { console.error('Error:', error); });
        
      delete timers[message.author.id];
      tasksetting(1, message.author.id, message)
      datas.save(bag, message.author.id);
    }, time);
    // タイマー情報をオブジェクトに格納する
    timers[message.author.id] = {
      shsting: true,
      timerId: timerId,
      timer: timer,
      date: jatime
    };
    // console.log(timers[message.author.id])
    Cirno.data.map.shst = true
    await datas.save(Cirno, message.author.id);
  } 
  if (message.content === 'cio!shgu') {
    if (!timers[message.author.id]) {
      return message.reply('現在たんさくしてないよー');
      delete timers[message.author.id];
    }
    const timerInfo = timers[message.author.id]; // タイマー情報を取得する
    clearTimeout(timerInfo.timer); // タイマーをキャンセルする
    delete timers[message.author.id]; // タイマー情報を削除する
    if(April == true) { //エイプリルフール
      return message.reply(`探索やめちゃうのー？意志よわーい♡ざーこざーこ♡`);
    }
    message.reply('たんさくをあきらめたよ...'); // アラートを送信する
  }
  if (message.content.startsWith("cio!bag")){
  // if (message.guildId === "1100357395244404756") return
  const args = parseInt(message.content.split(" ").slice(1,2).join(" "));
    
  const Cirno = await datas.get("user", message.author.id) 
  let itemData = require('./items.json');

  const embed = new MessageEmbed()
    .setColor(Cirno.data.setting.Usercolor)
    .setDescription('所持しているアイテムの一覧です')
    .setAuthor({ name: `${message.member.displayName ?? message.author.username}s Bag.`, iconURL: 'https://cdn.discordapp.com/attachments/1113105921414021171/1156157699566870618/rucksack_backpack.png' })

    if (!bag.data.items) return console.log("null bag")
        // BAGのアイテム情報を取得してArrayに格納
    const itemsInBag = bag.data.items.map(bagItem => {
      const itemId = bagItem.item.itemid;
      const itemDetail = itemData.items.find(item => item.itemid === itemId);
      if (itemDetail) {
        const { name, description, rarity, type } = itemDetail;
        const num = bagItem.item.num;
        if (num === 0) {
          return null;
        }    

        const formattedType = Array.isArray(type) ? type.join(', ') : type;
        
        return { name, description, rarity: replaceCharacters(rarity), type: formattedType, num: bagItem.item.num };
      }
      return null;
    });

    // nullを除外して最終的なアイテムの配列を取得・
    const filteredItems = itemsInBag.filter(item => item !== null);

    const itemsPerPage = 6;
    const paginatedItems = paginateItems(filteredItems, itemsPerPage);

    // 特定のページのアイテムを取得する例
    const currentPageNumber = args || 1; // 1ページ目を取得する例
    const itemsForPage = getItemsForPage(paginatedItems, currentPageNumber);
    
          // 最初のページかを検知
    const isFirstPage = currentPageNumber === 1;

    // 最後のページかを検知
    const isLastPage = currentPageNumber === paginatedItems.length;
    //SECONDARY
    const buttons = [
       new MessageButton() .setCustomId("b_back") .setStyle("SECONDARY") .setEmoji('1202156579378712577') .setDisabled(isFirstPage),
       new MessageButton() .setCustomId("b_next") .setStyle("SECONDARY") .setEmoji('1202156533949923328') .setDisabled(isLastPage),
       new MessageButton() .setCustomId("b_num") .setStyle("PRIMARY") .setEmoji('1157954917202399302'),
       new MessageButton() .setCustomId("b_rare") .setStyle("PRIMARY") .setEmoji('1157955021435064360'),
       new MessageButton() .setCustomId("b_compact") .setStyle("PRIMARY") .setEmoji('1202123999648423956')
     ]
    
    if (itemsInBag.length === 0) return message.channel.send(`アイテムがないよ！`);
    if (itemsForPage == null) return message.channel.send(`${currentPageNumber}ページ目にはアイテムがないよ！`);
    bagsetting[message.author.id] = {
      page: currentPageNumber,
      filter: "b_num",
      compact: false
    }
    embed.setTitle(`所持アイテム一覧：${currentPageNumber}ページ目`);
    for (const re of itemsForPage) {
      embed.addFields({ name: `${re.name} ${re.rarity}`, value: "タイプ: **`" + re.type +"`**\n所持数: **`" +re.num +"`**\n説明:\n> " + re.description, inline: true });
    }
  message.channel.send({ embeds: [embed], components: [new MessageActionRow().addComponents(buttons)] });
  }
});
client.on('interactionCreate', async (interaction) => {
  if (!['b_back', 'b_next', 'b_rare', 'b_num', 'b_compact'].includes(interaction.customId)) {
    return;
  }

  const bag = await datas.get("bag", interaction.user.id);
  const Cirno = await datas.get("user", interaction.user.id);
  const itemData = require('./items.json');

  const itemsInBag = bag.data.items.map(bagItem => {
    const itemId = bagItem.item.itemid;
    const itemDetail = itemData.items.find(item => item.itemid === itemId);
    if (itemDetail && bagItem.item.num > 0) {
      const { name, description, rarity, type } = itemDetail;
      const formattedType = Array.isArray(type) ? type.join(', ') : type;
      return { name, description, ra: rarity, rarity: replaceCharacters(rarity), type: formattedType, num: bagItem.item.num };
    }
    return null;
  });
  let i, filter, iscompact
  if (bagsetting[interaction.user.id]) {
    i = bagsetting[interaction.user.id].page || 1 
    filter = bagsetting[interaction.user.id].filter || null
    iscompact = bagsetting[interaction.user.id].compact || false
    
    console.log("通過")
    if (interaction.customId === 'b_back'){
      i--
    } else if (interaction.customId === 'b_next') {
      i++
    } else if (interaction.customId === 'b_num') {
      filter = 'b_num'
      
    } else if(interaction.customId === 'b_rare') {
      filter  = "b_rare"
      
    } else if(interaction.customId === 'b_compact'){
      if(iscompact == true){
        iscompact = false
      } else {
        iscompact = true
      }
    }
    bagsetting[interaction.user.id] = {
      page: i,
      filter,
      compact: iscompact
    }
  } else {
    bagsetting[interaction.user.id] = {
      page: 1,
      filter: "b_num",
      compact: false
    }
  }
  console.log(bagsetting[interaction.user.id])

  const filteredItemsInBag = itemsInBag.filter(item => item !== null);
  const sortedItems = sortBy(filteredItemsInBag, "DESC", filter === 'b_num' ? 'num' : 'ra');

  const itemsPerPage = 6;

  const currentPageNumber = i || 1;
  console.log(currentPageNumber)
  
  const paginatedItems = paginateItems(sortedItems, itemsPerPage);
  
  const itemsForPage = getItemsForPage(paginatedItems, currentPageNumber);
  
    // 最初のページかを検知
  const isFirstPage = currentPageNumber === 1;

  // 最後のページかを検知
  const isLastPage = currentPageNumber === paginatedItems.length;

  const embed = new MessageEmbed()
    .setColor(Cirno.data.setting.Usercolor)
    .setDescription(filter === 'b_num' ? 'アイテム数でソートしたアイテムの一覧です' : 'レアリティーでソートしたアイテムの一覧です')
    .setAuthor({ name: `${interaction.user.username}s Bag.`, iconURL: 'https://cdn.discordapp.com/attachments/1113105921414021171/1156157699566870618/rucksack_backpack.png' })
    .setTitle(`所持アイテム一覧：${currentPageNumber}ページ目`);

  try {
    itemsForPage.forEach(re => {
      embed.addFields({ name: `${re.name} ${re.rarity}`, value: iscompact == true ? `所持数: **\`${re.num}\`**`:`タイプ: **\`${re.type}\`**\n所持数: **\`${re.num}\`**\n説明:\n> ${re.description}`, inline: true });
    });
  } catch (error) {
    console.error('エラーが発生しました:', error);
    return interaction.reply({ content: "エラーが発生しました。もう一度指定して下さい", ephemeral: true });
  }

  const buttons = [
    new MessageButton() .setCustomId("b_back") .setStyle("SECONDARY") .setEmoji('1202156579378712577') .setDisabled(isFirstPage),
    new MessageButton() .setCustomId("b_next") .setStyle("SECONDARY") .setEmoji('1202156533949923328') .setDisabled(isLastPage),
    new MessageButton() .setCustomId("b_num") .setStyle("PRIMARY") .setEmoji('1157954917202399302') .setDisabled(interaction.customId === 'b_num'),
    new MessageButton()　.setCustomId("b_rare") .setStyle("PRIMARY") .setEmoji('1157955021435064360') .setDisabled(interaction.customId === 'b_rare'),
    new MessageButton() .setCustomId("b_compact") .setStyle("PRIMARY") .setEmoji('1202123999648423956')
  ];

  const message = await interaction.channel.messages.fetch(interaction.message.id);
  await interaction.update({ embeds: [embed], components: [new MessageActionRow().addComponents(buttons)] });
});

//itemCell
const selldata = {}
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId == 'itemsell') {
    const bag = await datas.get("bag", interaction.user.id) 
    let itemData = require('./items.json');
    let id = parseInt(interaction.values[0])
    
    const existingItem = bag.data.items.find(function(item) {
      return item.item.itemid === id
    });
    const itemDetail = itemData.items.find(item => item.itemid === id);
    const { name, itemid, sell } = itemDetail;
    selldata[interaction.user.id] = { sell, id }
    const modal = new Modal()
        .setCustomId('myModal')
        .setTitle(`${name}を売りますか？`);
    
    const favoriteColorInput = new TextInputComponent()
      .setCustomId('favoriteColorInput')
      .setLabel(`売る量を入力してください(${name}の所持数：${existingItem.item.num}個)`)
      .setStyle('SHORT');
    
    const firstActionRow = new MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  }
  
  if (interaction.customId === 'myModal') {
    let input = interaction.fields.getTextInputValue('favoriteColorInput')
    let int = parseInt(input, 10)
    if (isNaN(int)) {
      return interaction.reply({ content: "数字を入力してください！", ephemeral: true });
    } else {
      const bag = await datas.get("bag", interaction.user.id) 
      const Cirno = await datas.get("user", interaction.user.id) 
      let log = ""
      const existingItem = bag.data.items.find(function(item) {
        return item.item.itemid === selldata[interaction.user.id].id
      });
      if (Number.isInteger(int) == false) return interaction.reply({ content: "少数は指定できません！", ephemeral: true });
      if (existingItem.item.num < int) return interaction.reply({ content: "所持数を超える量は指定できません！", ephemeral: true });
      if (int < 1) return interaction.reply({ content: "マイナス値そして0は設定できません！", ephemeral: true });
      
      let itemData = require('./items.json');
      let newItem = itemData.items.find(item => item.itemid === selldata[interaction.user.id].id);
      
      existingItem.item.num -= int
      
      let a = bag.data.items.find(function(item) {
        return item.item.itemid === 10000000
      });
      
      let result = a.item.num
      a.item.num += Math.floor(selldata[interaction.user.id].sell * int)
      
      Cirno.data.chara.User.TotalAction.numSell += Math.floor(selldata[interaction.user.id].sell * int)
      
      datas.save(Cirno, interaction.user.id);
      datas.save(bag, interaction.user.id);
      
      const embed = new MessageEmbed()
        .setTitle(`売却履歴`)
        .addFields(
          { name: 'ユーザー', value: `> **${interaction.user.username}** (\`${interaction.user.id}\`)` },
          { name: '売却物', value: `> **${newItem.name}**(\`${selldata[interaction.user.id].id}\`)` },
          { name: '売却数', value: `> ${input}個 (額にして：**${selldata[interaction.user.id].sell * int}**円)` },
          { name: '変化', value: `> **${result}**円→**${result+selldata[interaction.user.id].sell*int}**円` }
        )
      　.setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
        .setTimestamp();
      client.channels.cache.get("1158758280726839356").send({ embeds: [embed] });
      tasksetting(12, interaction.user.id, interaction)
      return interaction.reply({ content: `売却成功！\n${result}円→${result+selldata[interaction.user.id].sell*int}円`, ephemeral: true });
    }

	}
});
//itemBuy
const buydata = {}
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId == 'itembuy') {
    const bag = await datas.get("bag", interaction.user.id) 
    const tas = await datas.get("day", 'task')
    const storeitem = tas.data.buy
    let itemData = require('./items.json');
    let id = parseInt(interaction.values[0])
    
    const existingItem = bag.data.items.find(function(item) {
      return item.item.itemid === id
    });
    const itemDetail = itemData.items.find(item => item.itemid === id);
    const { name, itemid, buy } = itemDetail;
    buydata[interaction.user.id] = { buy, id }
    const existingItem2 = storeitem.find(function(items) {
      return items.itemid === itemid;
    });
    const modal = new Modal()
        .setCustomId('buyModal')
        .setTitle(`${name}を買いますか？`);
    
    const favoriteColorInput = new TextInputComponent()
      .setCustomId('buyinput')
      .setLabel(`購入する量をを入力してください(${name}の残り品数:${existingItem2.num}個)`)
      .setStyle('SHORT');
    
    const firstActionRow = new MessageActionRow().addComponents(favoriteColorInput);
    modal.addComponents(firstActionRow);
    await interaction.showModal(modal);
  }
  
  if (interaction.customId === 'buyModal') {
    let input = interaction.fields.getTextInputValue('buyinput')
    let int = parseInt(input, 10)
    if (isNaN(int)) {
      return interaction.reply({ content: "数字を入力してください！", ephemeral: true });
    } else {
      const bag = await datas.get("bag", interaction.user.id) 
      const Cirno = await datas.get("user", interaction.user.id) 
      const tas = await datas.get("day", 'task')
      let itemData = require('./items.json');
      const storeitem = tas.data.buy
      let log = ""
      
      const existingItem = bag.data.items.find(function(item) {
        return item.item.itemid === buydata[interaction.user.id].id
      });
      
      const existingItem2 = storeitem.find(function(items) {
        return items.itemid === buydata[interaction.user.id].id;
      });
      const existingItem3 = itemData.items.find(function(items) {
        return items.itemid === buydata[interaction.user.id].id;
      });
      
      if (existingItem2.num < int) return interaction.reply({ content: "こーりん:そんなに品数ないよ。", ephemeral: true });
      let money = bag.data.items.find(function(item) {
        return item.item.itemid === 10000000
      });
      
      if (!money) return interaction.reply({ content: "こーりん:お金が足りないね。", ephemeral: true });
      if (Number.isInteger(int) == false) return interaction.reply({ content: "少数？商品を分割する気かい？", ephemeral: true });
      if (money.item.num < buydata[interaction.user.id].buy * int) return interaction.reply({ content: "こーりん:お金が足りないね。", ephemeral: true });
      if (int < 1) return interaction.reply({ content: "こーりん:何も買わないはだめだよ。", ephemeral: true });
      
      
      let newItem = itemData.items.find(item => item.itemid === buydata[interaction.user.id].id);
      
      if (existingItem) { //あったら
        existingItem.item.num += int; //加算
      } else {
        const newItemObj = { //なかったら新しく作って
        itemid: buydata[interaction.user.id].id,
        num: int,
      };    
        bag.data.items.push({ item: newItemObj });
      }
      
      existingItem2.num -= int
      
      let result = money.item.num
      money.item.num -= Math.floor(buydata[interaction.user.id].buy * int)
      
      Cirno.data.chara.User.TotalAction.numBuy += Math.floor(buydata[interaction.user.id].buy * int)
      
      datas.save(Cirno, interaction.user.id);
      datas.save(bag, interaction.user.id);
      datas.save(tas, "task");
      
      const embed = new MessageEmbed()
        .setTitle(`購入履歴`)
        .addFields(
          { name: 'ユーザー', value: `> **${interaction.user.username}** (\`${interaction.user.id}\`)` },
          { name: '購入物', value: `> **${existingItem3.name}**(\`${buydata[interaction.user.id].id}\`)` },
          { name: '購入数', value: `> ${input}個 (額にして：**${buydata[interaction.user.id].buy * int}**円)` },
          { name: '変化', value: `> **${result}**円→**${result-buydata[interaction.user.id].buy*int}**円` }
        )
      　.setAuthor({ name: `${interaction.user.username}`, iconURL: `${interaction.user.displayAvatarURL()}` })
        .setTimestamp();
      client.channels.cache.get("1201073816579879022").send({ embeds: [embed] });
      tasksetting(13, interaction.user.id, interaction)
      return interaction.reply({ content: `こーりん:まいどあり！`, ephemeral: true });
    }

	}
});
//itemuse
const usedata = {}
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId == 'itemuse') {
    const bag = await datas.get("bag", interaction.user.id) 
    
    let itemData = require('./items.json');
    let id = parseInt(interaction.values[0])
    
    const existingItem = bag.data.items.find(function(item) {
      return item.item.itemid === id
    });
    const itemDetail = itemData.items.find(item => item.itemid === id);
    const { name, itemid, sell, recovering, type} = itemDetail;
    usedata[interaction.user.id] = { recovering, id, type }
    
    const buttons = [
      new MessageButton() .setCustomId("use") .setStyle("SUCCESS") .setLabel("使う！"),
      new MessageButton()　.setCustomId("notuse") .setStyle("DANGER") .setLabel("使わん！"), 
    ];
    interaction.reply({ content: `本当に使用しますか？`, components: [new MessageActionRow().addComponents(buttons)], ephemeral: true });
    
  }
  
  if (interaction.customId === 'use') {
    const bag = await datas.get("bag", interaction.user.id) 
    const day = await datas.get("day", interaction.user.id) 
    const user = await datas.get("user", interaction.user.id)
    const existingItem = bag.data.items.find(function(item) {
      return item.item.itemid === usedata[interaction.user.id].id
    });
    
    if (existingItem.item.num <= 0)return interaction.reply({ content: "アイテムが足りません！", ephemeral: true });
    
    let type = usedata[interaction.user.id].type
    if (type.includes("food")){
      if (day.data.shst_day <= 0) return interaction.reply({ content: "体力がMax元気もりもりです！", ephemeral: true });
      
      let itemData = require('./items.json');
      let newItem = itemData.items.find(item => item.itemid === usedata[interaction.user.id].id);

      day.data.shst_day -= usedata[interaction.user.id].recovering
      existingItem.item.num -= 1;

      datas.save(bag, interaction.user.id);
      datas.save(day, interaction.user.id);

      return interaction.reply({ content: "使用しました！体力が" + usedata[interaction.user.id].recovering +"回復！", ephemeral: true });
      
    } else if (type.includes("buff")){
      if (!user.data.buff) {
        user.data.buff = []
        datas.save(user, interaction.user.id);
      }
      let itemData = require('./items.json');
      let newItem = itemData.items.find(item => item.itemid === usedata[interaction.user.id].id);
      const { name, itemid, buffid } = newItem;
      const foundItem = user.data.buff.find(function(item) {
        return item.id === buffid;
      });
      let j = buffjson.buffs.find(item => item.id === buffid);
      console.log(foundItem)
      if (foundItem) {
        if (type.includes("notshsting") && timers[interaction.user.id]) return interaction.reply({ content: "現在探索中なので使用できません！", ephemeral: true });
        if(foundItem.layered >= j.layered) return interaction.reply({ content: "これ以上効果を重ね掛け出来ないので使用できません！", ephemeral: true });
        foundItem.layered ++
      } else {
        let k = { id: j.id, name: j.name, layered: 1 , duration: j.duration }
        user.data.buff.push(k)
      }
      existingItem.item.num -= 1;
      
      datas.save(bag, interaction.user.id);
      datas.save(user, interaction.user.id);
      return interaction.reply({ content: "使用しました！", ephemeral: true });
    } else if (type.includes("use")){
      let itemData = require('./items.json');
      let newItem = itemData.items.find(item => item.itemid === usedata[interaction.user.id].id);
      const { name, itemid, buffid } = newItem;
      
      let buffoption = await buff.buff(buffid, null, interaction.user.id)
      
      if(buffid == 6) {} else {
        existingItem.item.num -= 1;
      }

      datas.save(bag, interaction.user.id);
      return interaction.reply({ content: `使用しました！\n${buffoption}`, ephemeral: true });
    }
  }
  if (interaction.customId === 'notuse') {
    return interaction.reply({ content: "使用をキャンセルしました", ephemeral: true });
  }
});
//alch
const alchdata = {}
const alchdata2 = {}
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId == 'itemalch') {
    const bag = await datas.get("bag", interaction.user.id) 
    
    let itemData = require('./items.json');
    
    const targetItemId = parseInt(interaction.values[0]);

    // アイテムバッグ内の指定されたアイテムの情報を取得する関数
    const compareItemsAndBag = (itemId) => {
      // 特定のアイテムデータを取得
      const itemDataItem = itemData.items.find(item => item.itemid === itemId);
      if (!itemDataItem) {
        console.log("指定されたitemidのアイテムデータが見つかりませんでした。");
        return;
      }

      const alchMaterials = itemDataItem.alch.material;

      const A = [];
      const B = [];
      const C = [];

      // alchのmaterial内の要素とアイテムバッグ内のアイテムを比較
      alchMaterials.forEach(material => {
        const { id, num } = material;
        const itemBagItem = bag.data.items.find(item => item.item.itemid === id);
        const itemDataitem = itemData.items.find(item => item.itemid === id);
        let bagnum 
        if(!itemBagItem) {
          bagnum = 0
        } else {
          bagnum = itemBagItem.item.num
        }
        A.push({ id, num: bagnum });
        B.push({ id, num });
        C.push(`${itemDataitem.name}: ${num}/ ${bagnum}個`)
      });

      return { A, B, C }
    };

    // アイテムデータとアイテムバッグを比較する
    const mats = compareItemsAndBag(targetItemId); // ここにアイテムIDを指定
    
    function compareObjects(A, B) {
      // 各要素が true であるかどうかを格納する変数
      let allTrue = true;

      // A と B の長さが異なる場合は false を返す
      if (A.length !== B.length) {
        return false;
      }

      // A の各要素に対して繰り返し
      for (let i = 0; i < A.length; i++) {
        // A の要素が B に存在しない場合は false を返す
        const correspondingB = B.find(item => item.id === A[i].id);
        if (!correspondingB) {
          return false;
        }

        // A の num が B の num より小さい場合は false を返す
        if (A[i].num < correspondingB.num) {
          allTrue = false;
          break;
        }
      }

      return allTrue;
    }
    
    const result = compareObjects(mats.A, mats.B);
    
    alchdata[interaction.user.id] = mats.B
    alchdata2[interaction.user.id] = targetItemId
    
    const buttons = [
      new MessageButton() .setCustomId("alch-ok") .setStyle("SUCCESS") .setLabel(result == true ? "錬金する！" : "アイテムが足りない！") .setDisabled(result == false),
      new MessageButton()　.setCustomId("alch-no") .setStyle("DANGER") .setLabel("キャンセル"), 
    ];
    interaction.update({ content: `このアイテムを錬金しますか？\n必要なアイテム\n${mats.C.join("\n")}`, components: [new MessageActionRow().addComponents(buttons)], ephemeral: true });
    
  }
  
if (interaction.customId === 'alch-ok') {
    const bag = await datas.get("bag", interaction.user.id);
    const Cirno = await datas.get("user", interaction.user.id);
    let itemData = require('./items.json');
    let endtime;

    const existingItem = itemData.items.find(function(item) {
        return item.itemid === alchdata2[interaction.user.id];
    });

    if (!existingItem) {
        return interaction.update({ content: "不明なエラーが発生しました。", components: [], ephemeral: true });
    }

    // アイテム不足チェック
    for (let i = 0; i < alchdata[interaction.user.id].length; i++) {
        const requiredItem = alchdata[interaction.user.id][i];
        const bagItem = bag.data.items.find(item => item.item.itemid === requiredItem.id);

        if (!bagItem || bagItem.item.num < requiredItem.num) {
            return interaction.update({ content: "アイテムが不足しています！", components: [], ephemeral: true });
        }
    }

    // データ初期化とスロット確認
    if (!Cirno.data.alch) {
        Cirno.data.alch = {
            "MAX_SROT": 3,
            "ing": [],
        };
        await datas.save(Cirno, interaction.user.id);
    }

    if (Cirno.data.alch.ing.length >= Cirno.data.alch.MAX_SROT) {
        return interaction.update({ content: "スロットが満杯です！", components: [], ephemeral: true });
    }

    // 終了時間の計算
    let currentDate = new Date();
    currentDate.setTime(currentDate.getTime() + existingItem.alch.time);
    let unixTime = Math.floor(currentDate.getTime() / 1000);
    endtime = unixTime;

    // アイテム消費
    for (let i = 0; i < alchdata[interaction.user.id].length; i++) {
        const requiredItem = alchdata[interaction.user.id][i];
        const bagItem = bag.data.items.find(item => item.item.itemid === requiredItem.id);
        bagItem.item.num -= requiredItem.num;
    }
  
    // 錬金データ追加
    Cirno.data.alch.ing.push({
        "EndDate": currentDate,
        "id": alchdata2[interaction.user.id]
    });
    await datas.save(Cirno, interaction.user.id);
    await datas.save(bag, interaction.user.id);

    let remainingSlots = Cirno.data.alch.MAX_SROT - Cirno.data.alch.ing.length;


    return interaction.update({
        content: `錬金開始！\n終了予定時間：<t:${endtime}:F>(<t:${endtime}:R>)\n残り錬金スロット数：${remainingSlots}`,
        components: [],
        ephemeral: true
    });
}
  if (interaction.customId === 'alch-no') {
    return interaction.update({ content: "使用をキャンセルしました", components: [], ephemeral: true });
  }
});
//user
client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return; 
    if (message.content === "cio!user"){
      if (message.channel.type === 'GUILD_TEXT' || message.channel.type === 'GUILD_PUBLIC_THREAD' || message.channel.type === 'GUILD_PRIVATE_THREAD') {
        const Cirno = await datas.get("user", message.author.id) 
        const uico = message.author;
        const avatarUrl = uico.displayAvatarURL({ dynamic: true });
        const guild = await client.guilds.fetch(message.guild.id);
        const member = await guild.members.fetch(message.author.id);
        const joinDate = member.joinedAt.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const set = new MessageEmbed()
        .setTitle("あなたの情報")
        .setAuthor({ name: `${message.member.displayName}`, iconURL: avatarUrl })
        .setThumbnail(avatarUrl)
        .addFields(
          { name: 'サーバー参加日', value: `${joinDate}` }, // Embedにフィールドを追加する
          { name: 'LvUP通知', value: `${Cirno.data.setting.l_notice ?? "false"}` },	
          { name: '自動URL変換', value: `${Cirno.data.setting.twitter.con_x ?? "false"}` },
          { name: '自動URL変換・元メッセージ削除', value: `${Cirno.data.setting.twitter.con_x_del ?? "false"}` },
          { name: '自動URL変換・自動固定', value: `${Cirno.data.setting.twitter.com_x_fix ?? "false"}` },
          { name: '自動URL変換・変換形式', value: `${Cirno.data.setting.twitter.com_x_des ?? "fxtwitter"}` },
          { name: 'ユーザーカラー', value: `${Cirno.data.setting.Usercolor ?? "デフォルト(未設定)"}` },
          { name: '200,300Ping回数', value: `${Cirno.data.setting.ping.twoping}回、${Cirno.data.setting.ping.threeping}回` },
          { name: '最低Ping値', value: `${Cirno.data.setting.ping.maxping ?? 0}Ping` },
          { name: '一回の付与経験値量', value: `**${Cirno.data.chara.lv.giveXp.min}**XP 〜 **${Cirno.data.chara.lv.giveXp.max}**XP` },
        )
       .setColor(`${Cirno.data.setting.Usercolor}`)
        message.reply({ embeds: [set] });
        tasksetting(9, message.author.id, message)
        return;
      } else {
        message.reply('このコマンドはサーバーチャンネルでのみ実行できます。');
        return;
      }
    }
    if (message.content.startsWith("cio!icoc")) {
      const Cirno = await datas.get("user", message.author.id) 
      const co = message.content.split(" ").slice(1).join(" ");
      if (!co) return message.channel.send(`カラーを入力してね！`);
      Cirno.data.setting.Usercolor = co; 
      await datas.save(Cirno, message.author.id);
      message.channel.send(`ユーザーカラーを変更したよ！`);
      return;
    }
    if (message.content.startsWith("cio!status")) {
      const Cirno = await datas.get("user", message.author.id) 
      const bag = await datas.get("bag", message.author.id) 
      const day = await datas.get("day", message.author.id)
      const s = await datas.get("day", "task")
      let moneyfind = bag.data.items.find(function(item) {
        return item.item.itemid === 10000000
      });
      let moneynum = moneyfind.item.num || 0
      let a = Cirno.data.login.bairitu;
      const uico = message.author;
      const avatarUrl = uico.displayAvatarURL({ dynamic: true });
      const lastLoginDate = new Date(Cirno.data.login.lastLoginDate).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })|| "データなし";
      Cirno.data.login.bairitu
      const embed = new MessageEmbed()
        .setTitle("今日のステータス")
        .setAuthor({ name: `${message.member.displayName}`, iconURL: avatarUrl })
        .addFields({ name: "ログイン", value: `>>> ログイン状況\n<:ya:1168564476186988644>**\`${day.data.login_day === 1 ? "ログイン済み" : "未ログイン"}\`**\n最終ログイン\n<:ya:1168564476186988644>**\`${lastLoginDate}\`**\nログイン倍率\n<:ya:1168564476186988644>**\`${a.toFixed(1)}倍\`**`},
                   { name: "探索回数", value: `<:ya:1168564476186988644>**\`${day.data.shst_day} / ${shstnum}\`**`},
                   { name: "１日Ping状況", value: `<:ya:1168564476186988644>**\`${day.data.ping_day === 1 ? "実行済み" : "未実行"}\`**`})
      embed.addFields({ name: "所持金", value: `<:ya:1168564476186988644> **\`${moneynum}円\`**`})
      var text = []
      var tasks = day.data.task
      if (tasks) {
        const completedTasks = s.data.task.filter((task) => tasks.some((usertask) => usertask === task.id))
        const remainingTasks = s.data.task.filter((task) => !tasks.some((usertask) => usertask === task.id))
        
        if (remainingTasks.length === 0){
          text.push(`すべて完了！`)
        } else {  
          for (const task of completedTasks) {
            text.push(`${task.name}:✅`)
          } 
          for (const task of remainingTasks) {
            text.push(`${task.name}:❎`)
          } 
        }
      } else {
        console.log("なし")
        for (const task of s.task) {
          text.push(`${task.name}:❎`)
        }
      }
      embed.addFields({ name: "課題状況", value: `\`\`\`\n${text.join("\n")}\n\`\`\``})
      let bufff = Cirno.data.buff || []
      if (bufff.length >= 1) {
        let text2 = []
        for (let i of Cirno.data.buff){
          let a = `${i.name}`
          if (i.layered >= 2){
            a += ` (${i.layered}回重ね掛け)`
          }
          a += `（残り${i.duration}回）`
          text2.push(a)
        }
        embed.addFields({ name: "効果状況", value: `\`\`\`\n${text2.join("\n")}\n\`\`\``})
      }
      message.reply({ embeds: [embed] });
      tasksetting(10, message.author.id, message)
      return;
    }
  if (message.content.startsWith("cio!stati")) {
      const Cirno = await datas.get("user", message.author.id) 
      const day = await datas.get("day", message.author.id)
      const s = await datas.get("day", "task")
      const uico = message.author;
      const avatarUrl = uico.displayAvatarURL({ dynamic: true });
      
      let num = Cirno.data.chara.User.TotalAction

      const embed = new MessageEmbed()
        .setTitle("統計")
        .setAuthor({ name: `${message.member.displayName}`, iconURL: avatarUrl })
        .addFields({ name: "合計ログイン回数", value: `<:ya:1168564476186988644>**\`${num.numLogin}\`回**`},
                   { name: "合計探索回数", value: `<:ya:1168564476186988644>**\`${num.numShst}\`回**`},
                   { name: "１日Ping合計", value: `<:ya:1168564476186988644>**\`${num.numPing}\`回**`},
                   { name: "合計課題完了数", value: `<:ya:1168564476186988644>**\`${num.numTask}\`回**`},
                   { name: "合計売却金額", value: `<:ya:1168564476186988644>**\`${num.numSell}\`円**`},
                   { name: "合計購入金額", value: `<:ya:1168564476186988644>**\`${num.numBuy}\`円**`})
      message.reply({ embeds: [embed] });
      return;
    }
  });

//url

// 除外するチャンネルIDのリスト
const EXCLUDED_CHANNEL_IDS = ['1317851064493543464'];

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('https://discord.com/channels/')) {
    const messageUrl = message.content.split(' ')[0];
    const urlRegex = /^https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)$/g;
    const match = urlRegex.exec(messageUrl);
    
    if (match) {
      const guildId = match[1];
      const channelId = match[2];
      const messageId = match[3];
      const attachmentIndex = parseInt(message.content.split(' ')[1]);
      
      if (message.author.bot || EXCLUDED_CHANNEL_IDS.includes(channelId)) return;
      
      try {
        const guild = client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);
        const targetMessage = await channel.messages.fetch(messageId);

        const user = targetMessage.author;
        const avatarExtension = user.avatar.startsWith('a_') ? 'gif' : 'png';
        const avatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}`;
        const japanTime = targetMessage.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
        const Cirno = await datas.get("user", message.author.id) 

        
        
        const embed = new MessageEmbed()
          .setAuthor({ name:`${targetMessage.author.username}`, iconURL: avatarURL})
          .setDescription(`\n\n${targetMessage.content}\n\n`)
          .addFields({ name:'メッセージ詳細', value: `メッセージ：[${targetMessage.author.username}](${messageUrl})\nチャンネル：[${channel.name}](${messageUrl})\n投稿時間：${japanTime}`})
          .setTimestamp()
          .setColor(`${Cirno.data.setting.Usercolor ?? "#000000"}`);

        // 添付ファイルがあれば埋め込みに追加
        if (targetMessage.attachments.size > 0) {
          const attachmentsArray = Array.from(targetMessage.attachments.values());

          let selectedAttachment;

          if (attachmentIndex && attachmentIndex >= 1 && attachmentIndex <= targetMessage.attachments.size) {
            selectedAttachment = attachmentsArray[attachmentIndex - 1];
          } else {
            selectedAttachment = attachmentsArray[0];
          }

          if (selectedAttachment.url.endsWith('.png') || selectedAttachment.url.endsWith('.jpeg') || selectedAttachment.url.endsWith('.jpg')) {
            embed.setImage(selectedAttachment.url);
          } else if (selectedAttachment.url.endsWith('.gif')) {
            // embed.setThumbnail(selectedAttachment.url);
            embed.setImage(selectedAttachment.url);
          } else if (selectedAttachment.url.endsWith('.mp4') || selectedAttachment.url.endsWith('.mov') || selectedAttachment.url.endsWith('.avi') || selectedAttachment.url.endsWith('.webm')) {
            embed.setDescription(`${targetMessage.content}\n[添付動画](${messageUrl})`);
            embed.setThumbnail(selectedAttachment.url);
            embed.setFooter({ text: '※添付ファイルが動画のため埋め込みに貼ることができませんでした。' });
          } else {
            embed.setDescription(`${targetMessage.content}\n[添付ファイル](${messageUrl})`);
            embed.setThumbnail(selectedAttachment.url);
            embed.setFooter({ text: '※添付ファイルが非対応の拡張子または埋め込みには貼れないファイルになっています。' });
          }
        }

        message.channel.send({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      return;
    }
  }
});
client.on('messageCreate', async (message) => {
  if (message.content.startsWith('https://x.com')) { // message.content.startsWith('https://twitter.com')||
    const Cirno = await datas.get("user", message.author.id) 
    const urlValue = message.content
    if (urlValue.includes('twitter.com') || urlValue.includes('x.com')) {
      if (Cirno.data.setting.twitter.con_x == "true") {
        const convertedUrl = urlValue.replace(/(twitter\.com|x\.com)/g, Cirno.data.setting.twitter.com_x_des || "fxtwitter.com");
        if (Cirno.data.setting.twitter.con_x_del == "true") {
          await message.delete();
        }
        const sentMessage = await message.channel.send(`メ者：${message.author}\n${convertedUrl}`);
        if (Cirno.data.setting.twitter.com_x_fix == "true") { return }
        // リアクションをメッセージに追加
        await sentMessage.react('🔒'); // thumbs up emoji
        await sentMessage.react('🔄'); // thumbs down emoji

        const filter = (reaction, user) => {
            return ['🔒', '🔄'].includes(reaction.emoji.name) && user.id === message.author.id;
        };

        const collector = sentMessage.createReactionCollector(filter, { time: 30000 });

        collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name === '🔒') {
             if (user.id === message.author.id) {
                sentMessage.reactions.cache.get('🔒').remove();
                sentMessage.reactions.cache.get('🔄').remove();
              } else {
                reaction.users.remove(user);
              }
            } else if (reaction.emoji.name === '🔄') {
              if (user.id === message.author.id) { 
                sentMessage.delete();
              } else {
                reaction.users.remove(user);
              }
            }
        });

        collector.on('end', collected => {
          sentMessage.reactions.cache.get('🔒').remove();
          sentMessage.reactions.cache.get('🔄').remove();
          console.log('Reaction collector ended.');
        });
      }
    }
  }
});
//task
client.on('messageCreate', async (message) => {
  if (message.content === 'cio!task') {
    // if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    const user = await datas.get("day", message.author.id) 
    const s = await datas.get("day", "task") 
    const uico = message.author;
    const avatarUrl = uico.displayAvatarURL({ dynamic: true });
    const embed = new MessageEmbed()
    .setAuthor({ name: `${message.member.displayName}`, iconURL: avatarUrl })
    .setTitle("課題状況")
    var tasks = user.data.task
    if (user.data.task) {
      const completedTasks = s.data.task.filter((task) => tasks.some((usertask) => usertask === task.id))
      const remainingTasks = s.data.task.filter((task) => !tasks.some((usertask) => usertask === task.id))

      for (const task of completedTasks) {
        embed.addFields({ name:`${task.name} ✅`, value:task.description });
      } 
      for (const task of remainingTasks) {
        embed.addFields({ name:`${task.name}`, value:task.description });
      } 
    } else {
      for (const task of s.task) {
        embed.addFields({ name:`${task.name}`, value:task.description });
      }
    }

    message.reply({ embeds: [embed] });
  }
  if (message.content === 'cio!taskset') {
    if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    const s = await datas.get("day", "task") 
    s.data.task = getRandomTasks(4)
    console.log(s.data.task)
    await datas.save(s, 'task');
    message.channel.send("今日の課題をせっていしたよ！");
  }
  if (message.content === 'cio!taskreset') {
    if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    const s = await datas.get("day", "task") 
    s.data.task = []
    console.log(s.data.task)
    await datas.save(s, 'task');
    message.channel.send("今日の課題をけしたよ！");
  }
  if (message.content === 'cio!dayreset') {
    if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    const guild = client.guilds.cache.get(serverId)
    const members = await guild.members.fetch();
    const users = members.filter((member) => !member.user.bot);
    for (const [memberId, member] of users) {
      const user = member.user;
      const userId = user.id;
      const users = await datas.get("day", userId)
      users.data.ping_day = 0
      users.data.shst_day = 0
      users.data.login_day = 0
      users.data.task = []
      await datas.save(users, userId)
    }
      // Task set
    const tas = await datas.get("day", 'task')
    tas.data.task = []
    tas.data.buy = []
    tas.data.task = getRandomTasks(3)
    const items = await SetRandomBuy(40)
    tas.data.buy = items
    tas.data.img = 0
    console.log(tas.data.task);
    await datas.save(tas, 'task');
    message.channel.send("リセットしたよ！");
  }
  if (message.content === 'cio!dayallreset') {
    if (message.author.id !== "811186190707195906")return message.reply("パリパリサラダ麵っておいしいよね");
    console.log("実行開始")
    const guild = client.guilds.cache.get(serverId)
    console.log("実行1")
    const members = await guild.members.fetch();
    const users = members.filter((member) => !member.user.bot);
    const userStats = [];

    // Day Data Reset
    for (const [memberId, member] of users) {
      const user = member.user;
      const userId = user.id;
      const users = await datas.get("day", userId)
      users.data.ping_day = 0
      users.data.shst_day = 0
      users.data.login_day = 0
      users.data.task = []
      await datas.save(users, userId)
    }
  // Task set
  const tas = await datas.get("day", 'task')
  tas.data.task = []
  tas.data.buy = []
  tas.data.task = getRandomTasks(3)
  const items = await SetRandomBuy(40)
  tas.data.buy = items
  tas.data.img = 0
  console.log(tas.data.task);
  await datas.save(tas, 'task');

    const data = await datas.get("daydata", serverId); // サーバーごとのデータを取得
    if (!data) return; // データが存在しない場合は何もしない
    const day = new MessageEmbed()   
      .setTitle(`**${moment().format('YYYY/MM/DD')} の統計データ**\n`)
    const goukei = { count: 0, chars: 0 }
      for (let hour = 0; hour < 24; hour++) {
        const hourData = data.data[hour];
        if (!hourData) continue; // データが存在しない場合はスキップ
        day.addFields({ name:`**${hour}時:**`, value: `**${hourData.count}**件 / **${hourData.chars}**文字`, inline: true})
        goukei.count += hourData.count
        goukei.chars += hourData.chars
      }
    day.addFields({ name:`**合計:**`, value: `**${goukei.count}**件 / **${goukei.chars}**文字`})
    const channel = await client.channels.fetch(channelId);
    await channel.send({ embeds: [day] });
    data.data = null
    await datas.save(data, serverId); // データをリセット
    console.log("実行完了")
  }
});
//help
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("cio!help")) {
    const args = message.content.split(" ");
    if (!isNaN(args[1])) {
      
    } else {
      args[1] = 1
    }
    const selectMenuOptions = helping.map((command) => ({
      label: command.name,
      description: command.description,
      value: command.name
    }));
    
    let preview
    const pageSize = 10; // ページごとのランキング表示数

    const page = args[1]
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedResult = selectMenuOptions.slice(startIndex, endIndex);
    // 指定された番号にはコマンド説明が登録されていません。別の番号をお試しください。
    if (getArrayOrNull(paginatedResult) == null) return message.reply(`指定されたページ番号にはコマンド説明が登録されていません。別の番号をお試しください`);
    const embed = new MessageEmbed()
      .setTitle('ちるのとのあそびかた（'+page+'ページ目）')
      .setDescription('利用可能なコマンド、機能一覧です。')
      .setColor('#7289DA');

    const selectMenu = new MessageSelectMenu()
      .setCustomId('help')
      .setPlaceholder('見たいコマンドをこの中から選んでね！')
      .addOptions(paginatedResult);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

    message.channel.send({ embeds: [embed], components: [actionRow] });
    tasksetting(3, message.author.id, message)
  }
});
client.on('interactionCreate', async (interaction) => {
  if (interaction.customId !== 'help') return;

  const selectedCommand = helping.find((command) => command.name === interaction.values[0]);

  const embed = new MessageEmbed()
    .setTitle(`コマンド: ${selectedCommand.name}`)
    .setDescription(selectedCommand.description)
    .addField('使用方法', `\`${selectedCommand.usage}\``)
    .setColor('#7289DA');

  interaction.reply({ embeds: [embed], ephemeral: true });
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.customId === "rank") {
    if (owner.includes(interaction.user.id) == false)return interaction.reply({ content: `あたい`, ephemeral: true });
    const guild = interaction.guild; // ギルド情報を取得
    const data = await MemberLevelReset(guild, cirno)
    const result = sortBy(data, "DESC", "to", "lv", "na");
    const formattedData = result.map((player, index) => {
      return `${index + 1}位 Lv ${player.lv} XP ${player.to}：${player.na}`;
    }).join('\n');
    
    fs.writeFile('ranking.txt', formattedData, (err) => {
    if (err) {
      console.error('データの書き出しエラー:', err);
    return interaction.reply({ content: `書き出しに失敗しました。`, ephemeral: true });
    }
      console.log('データが正常に書き出されました。');
      const attachment = new MessageAttachment('ranking.txt');
      interaction.reply({ content: `書き出し成功`, files: [attachment], ephemeral: true });
    });
  }
});
//admin (関係者以外使用禁止)
client.on('messageCreate', async (message) => {
  if (message.content === "cio!itemgive") {
    if (message.author.id !== "811186190707195906")return
    let id = 10000028;
    let num = 20;
    let givers = [
      "1194572919674781790"
    ]
    let itemData = require('./items.json');
    let newItem = itemData.items.find(item => item.itemid === id);
    for (const a of givers){
      const bag = await datas.get("bag", a)
      const existingItem = bag.data.items.find(item => item.itemid === id);
      if (existingItem) {
        existingItem.num += num;
      } else {
        if (newItem) {
          bag.data.items.push({ item:{
            itemid: newItem.itemid,
            num: num
          }});
        } else {
         console.log(`アイテムID ${id} のアイテムが見つかりません。`);
        }
      }
      datas.save(bag, a);
    }   
    console.log("END.")
  }
  if (message.content === "cio!textdata") {
    if (message.author.id !== "811186190707195906")return
    const buttons = [
      new MessageButton() .setCustomId("rank") .setStyle("PRIMARY") .setLabel("出力")
    ]
    message.channel.send({ content: "rankingデータを出力するよ！", components: [new MessageActionRow().addComponents(buttons)]})
  }
  if (message.content === "cio!allchange") {
    if (message.author.id !== "811186190707195906")return
    let num = 0
    const guild = message.guild; // ギルド情報を取得
    const members = await guild.members.fetch(); // ギルドメンバーを取得
    const users = members.filter((member) => !member.user.bot);
    for (const [memberId, member] of users) {
      const user = member.user;
      const userId = user.id;
      const nickname = member.nickname ?? user.username;

      const Cirno = await datas.get("user", userId) 
      Cirno.data.chara.lv.voice = {
        "lv": 1, 
        "xp": 0, 
        "Totalxp": 0,
        "Nextxp": 50 
      }
      
      await datas.save(Cirno, userId);
    }
    console.log("変更成功")
  }
  if (message.content === "cio!buyreset") {
    if (message.author.id !== "811186190707195906")return
    const tas = await datas.get("day", 'task')
    tas.data.buy = []
    const items = await SetRandomBuy(40)
    tas.data.buy = items
    await datas.save(tas, 'task');
    message.channel.send("商品一覧を更新したよ！");
  }
  if (message.content === "cio!voicereset") {
    if (message.author.id !== "811186190707195906")return
    membersInVoiceChannel = [];
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.type === 'GUILD_VOICE' && channel.members.size > 0) {
                channel.members.forEach(member => {
                    // メンバーがボットではない場合のみIDを追加
                    if (!member.user.bot) {
                        membersInVoiceChannel.push(member.id);
                    }
                });
            }
        });
    });
    let msg = await message.channel.send("VoicelevelingSystemを再起動します");
    const timer = setTimeout(() => {
      msg.delete()
    }, 1000);
    voiceleveling(membersInVoiceChannel, serverId)
  }
  if (message.content === "cio!tes") {
    if (message.author.id !== "811186190707195906")return
    const Cirno = await datas.get("user", "1147377482610249858")
    
    const Cirno2 = await datas.get("user", "1248495738745262131")
    
    Cirno2.data = Cirno.data
    
    await datas.save(Cirno2, "1248495738745262131")
    
    console.log("移行完了")
  }
  if (message.content === "# 凍結") {
    if (message.author.id !== "811186190707195906")return
    // 変更したい権限
    const permissions = {
      SEND_MESSAGES: false,
    };
    const channel = message.channel
    let roleid = "1187237891366199297"
    // const role = await channel.guild.roles.fetch(roleid);
    let myRole = message.guild.roles.cache.get(roleid);

    // return console.log(myRole)
    
    message.channel.permissionOverwrites.edit(roleid, permissions)
      .then(channel => {console.log("チャンネルのロールの権限を変更しました")
                       message.channel.send("# 凍符「パーフェクトフリーズ」！");
                       })
      .catch(console.error);
  }
  if (message.content === "# 解凍") {
    if (message.author.id !== "811186190707195906")return
    // 変更したい権限
    const permissions = {
      SEND_MESSAGES: null,
    };
    const channel = message.channel
    let roleid = "1187237891366199297"
    
    message.channel.permissionOverwrites.edit(roleid, permissions)
      .then(channel => {console.log("チャンネルのロールの権限を変更しました")
                       message.channel.send("あたい！");
                       })
      .catch(console.error);
  }
  if (message.content === "cio!get") {
    if (message.author.id !== "811186190707195906")return
    const Cirno = await datas.get("bag", message.author.id)
    console.log(Cirno)
  }
});
//リアクション
client.on("messageCreate", async (message) => {
    if (message.author.bot) { return; }
    const cool = await datas.get("cool", message.author.id)
    if (cool.data.downtime == true) {return;}
    cool.data = { downtime: true };
    const FORMAT = "HH";
    const now = new Date();
    const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
    // console.log(time);
    if (message.content.match(/おはようございます|おはよう|おは/)) {
      if (5 <= time && time <= 6) {
        var array = [
          "おはよー...ふあぁ...眠い...",
          "おはよー...早いね...",
          "おはよー..."
        ];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
    　}
      if (7 <= time && time <= 11) {
        var array = [
          "おはよー！",
          `おっはよー！あーそぼ！`
        ];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
      }
      return await datas.save(cool, message.author.id)
    }
    if (message.content.match(/こんにちは|こんちゃ|こんちは/)){
      if (11 <= time && time <= 17) {
        var array = [
          "あそぼー！",
          `あーそぼ！`
        ];
        message.channel.send(array[Math.floor(Math.random() * array.length)]);
      }
      return await datas.save(cool, message.author.id)
    }
    if (message.content.match(/ただいま|たでえま/)){
      message.channel.send("おかえりなさーい");
      return await datas.save(cool, message.author.id)
    }
    if (message.content === "チルノちゃん！最強を示して！"){
      const random = Math.random();
      const probability = 0.01;
      if (random < probability) {
        await datas.save(cool, message.author.id)
        return message.channel.send("じゃあ今からあたいが最強STRONGER歌うよ！\nﾃﾚﾚﾚｯﾃｯﾃｳｨｷﾄﾞｳｨｷカモンﾃﾚﾚﾚｯﾃｯﾃ ｳｨｻﾞｯ..ﾚｯﾂｺﾞﾂﾌｭｯﾌｭｷﾌｭｷｷｭｯｷｭｯｯYes♪ ｴﾝｻﾞｯ！ﾜﾝｯ！ﾁｭｯ！ｽﾘｯ！ﾌｫｫ！！ﾃﾞﾚﾚﾚﾝﾃﾞﾃﾞﾚﾚﾚﾝ ｳｯ! ﾃﾞﾚﾚﾚﾝﾃﾞﾃﾞﾚﾚﾚﾝ ｴｨ！"); // 確率に基づいて1を生成
      } else {
        return 0; // それ以外の場合は0を生成
      }
    }
    if (message.content === "チルノちゃーん"){
      await datas.save(cool, message.author.id)
      return message.channel.send("＼あたいってばさいきょーね!／");
    }
    if (message.content === "⑨"){
      await datas.save(cool, message.author.id)
      return message.channel.send("あたいバカじゃないもん！");
    }
    if (message.content === 'cio!janken') {
    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId('rock')
          .setLabel('グー')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('paper')
          .setLabel('パー')
          .setStyle('PRIMARY'),
        new MessageButton()
          .setCustomId('scissors')
          .setLabel('チョキ')
          .setStyle('PRIMARY'),
      );

    const reply = await message.reply({
      content: 'じゃんけん...？',
      components: [row],
    });

    const filter = (interaction) =>
      interaction.customId === 'rock' ||
      interaction.customId === 'paper' ||
      interaction.customId === 'scissors';

    const collector = reply.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', (interaction) => {
      if (interaction.user.id !== message.author.id) {
        // ボタンを押した人とメッセージ送信者が違う場合、処理をスルーする
        return;
      }

      const userChoice = interaction.customId;
      const botChoice = ['rock', 'paper', 'scissors'][
        Math.floor(Math.random() * 3)
      ];

      let result = '';

      if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        if(April == true) { //エイプリルフール
          result = 'あたいに勝って喜ぶなんて大人げなーい♡（あなたの勝ち）';
        } else {
          result = '...あたいの勝ちだもん。（あなたの勝ち）';
        }
      } else if (userChoice === botChoice) {
        if(April == true) { //エイプリルフール
          result = 'あはぁ～残念♡勝てなかったね笑';
        } else {
          result = 'ちぇっ、引き分けー';
        }
      } else {
        if(April == true) { //エイプリルフール
          result = 'ざんね～ん負けちゃったねぇ♡よわよわ～♡じゃんけんの弱者♡';
        } else {
          result = 'あたいの勝ち！';
        }
      }
      const choices = {
        rock: 'グー',
        paper: 'パー',
        scissors: 'チョキ',
      };

      interaction.reply(`あなた: ${choices[userChoice]}\nチルノ: ${choices[botChoice]}\n結果: ${result}`);
      reply.edit({ components: [] });
      tasksetting(11, message.author.id, message)
      return;
    });

    collector.on('end', () => {
      reply.edit({ components: [] });
    });
  }
});

const treadata = {}
client.on("messageCreate", async (message) => {
  // if (message.author.id !== "811186190707195906")return
  if (message.content === "cio!trea") {
    let size = 5
    const os = treaat(size)
    const find = createGrid(size)
    const text = placeOnes(find, os)
    const distance = calculateDistance(os.x1, os.y1, os.x2, os.y2);
    let turn = 0
    
    const uico = message.author;
    const avatarUrl = uico.displayAvatarURL({ dynamic: true });
    
    const embed = new MessageEmbed()
    .setAuthor({ name: `Playing:${message.member.displayName}`, iconURL: avatarUrl })
    .setTitle(`強度：${distance}`)
    .setDescription(gridToText(text))
    .setColor("#71C3FF")
    .setFooter({ text: `行動回数: ${turn}`});
    
    const buttons = [
       new MessageButton() .setCustomId("trea_n") .setStyle("PRIMARY") .setEmoji('⬆') .setDisabled(os.x1 == 1),
       new MessageButton() .setCustomId("trea_e") .setStyle("PRIMARY") .setEmoji('⬅') .setDisabled(os.y1 == 1),
       new MessageButton() .setCustomId("trea_w") .setStyle("PRIMARY") .setEmoji('➡') .setDisabled(os.y1 == size),
       new MessageButton() .setCustomId("trea_s") .setStyle("PRIMARY") .setEmoji('⬇') .setDisabled(os.x1 == size),
       new MessageButton() .setCustomId("trea_px") .setStyle("SUCCESS") .setEmoji('⛏')
     ]
    treadata[message.author.id] = { x1: os.x1, x2: os.x2, y1: os.y1, y2: os.y2, size, turn}
    message.channel.send({embeds: [embed], components: [new MessageActionRow().addComponents(buttons)]})
  }
});
client.on('interactionCreate', async (interaction) => {
  if (!treadata[interaction.user.id]) return
  const operation = async (x, y) => {
    let { x1, x2, y1, y2, size, turn } = treadata[interaction.user.id];
    x1 += x;
    y1 += y;
    const os = { x1, y1 };
    const find = createGrid(size);
    const text = placeOnes(find, os);
    const distance = calculateDistance(x1, y1, x2, y2);
    turn++;

    const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true });
    
    const embed = new MessageEmbed()
      .setAuthor({ name: `Playing:${interaction.user.username}`, iconURL: avatarUrl })
      .setTitle(`強度：${distance}`)
      .setDescription(gridToText(text))
      .setColor("#71C3FF")
      .setFooter({text:`行動回数: ${turn}`});

    const buttons = [
      new MessageButton().setCustomId("trea_n").setStyle("PRIMARY").setEmoji('⬆').setDisabled(os.x1 === 1),
      new MessageButton().setCustomId("trea_e").setStyle("PRIMARY").setEmoji('⬅').setDisabled(os.y1 === 1),
      new MessageButton().setCustomId("trea_w").setStyle("PRIMARY").setEmoji('➡').setDisabled(os.y1 === size),
      new MessageButton().setCustomId("trea_s").setStyle("PRIMARY").setEmoji('⬇').setDisabled(os.x1 === size),
      new MessageButton() .setCustomId("trea_px") .setStyle("SUCCESS") .setEmoji('⛏')
    ];

    treadata[interaction.user.id] = { x1, x2, y1, y2, size, turn };
    console.log(treadata[interaction.user.id])
    return await interaction.update({ embeds: [embed], components: [new MessageActionRow().addComponents(buttons)] });
  };

  switch (interaction.customId) {
    case "trea_n":
      operation(-1, 0);
      break;
    case "trea_e":
      operation(0, -1);
      break;
    case "trea_w":
      operation(0, 1);
      break;
    case "trea_s":
      operation(1, 0);
      break;
    case "trea_px":
      console.log("通貨")
      let { x1, x2, y1, y2, size, turn } = treadata[interaction.user.id];
      const areSame = checkIfSameCoordinates(x1, y1, x2, y2);
      console.log(areSame)
      const find = createGrid(size);
      const os = { x1,x2,y1,y2 };
      const text = placeOnes(find, os, true);
      const distance = calculateDistance(x1, y1, x2, y2);
      if (areSame == true) {
        const bag = await datas.get("bag", interaction.user.id) 
        let rank
        switch (turn){
          case turn > 10:
            rank = 200
            break;
          case turn > 15:
            rank = 150
            break;
          case turn > 20:
            rank = 100
            break;
          default:
            rank = 100
            break;
            
        }
        const nums = Math.floor(Math.random() * (rank - 50 + 2)) + 50;
        console.log(nums, rank)

        var existingItem = bag.data.items.find(function(item) {
          return item.item.itemid === 10000000;
        });

        if (existingItem) {
          existingItem.item.num += nums;
        } else {
          var newItem = {
            "itemid": 10000000,
            "num": nums
          };
          bag.data.items.push({ item: newItem });
        }　
        const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true });
        
        const embed = new MessageEmbed()
          .setAuthor({ name: `Playing:${interaction.user.username}`, iconURL: avatarUrl })
          .setTitle(`あたり！`)
          .setDescription(gridToText(text))
          .addFields({ name: 'おめでとう！', value: nums + `円を掘り当てた！` })
          .setColor("#71C3FF")
          .setFooter({text:`行動回数: ${turn}`});
        await interaction.message.edit({ embeds: [embed], components: [] }); 
        
        await datas.save(bag, interaction.user.id);
        
        tasksetting(5, interaction.user.id, interaction)
      } else {
        let context = { name: '残念！', value: `また挑戦してね！` }
        if(interaction.user.id == "811186190707195906" || April == true) { //エイプリルフール
        context = { name: 'ざんね～ん！', value: `お宝当てられないなんて探検向いてないんじゃないの～？あははっ！あんたがその気ならまた挑戦してね～♡` }
      　}
        const embed = new MessageEmbed()
          .setTitle(`はずれ！`)
          .setDescription(gridToText(text))
          .addFields({ name: context.name, value: context.value })
          .setColor("#71C3FF")
          .setFooter({text:`行動回数: ${turn}`});
        await interaction.message.edit({ embeds: [embed], components: [] });
        
        tasksetting(5, interaction.user.id, interaction)
      } 
      break;
    default:
      break;
  }
});

// メンバーのIDを格納する配列
let membersInVoiceChannel = [];

client.once('ready', () => {

    // ボットがログインしたときに各ギルドのボイスチャンネルにいるメンバーを取得
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.type === 'GUILD_VOICE' && channel.members.size > 0) {
                channel.members.forEach(member => {
                    // メンバーがボットではない場合のみIDを追加
                    if (!member.user.bot) {
                        membersInVoiceChannel.push(member.id);
                    }
                });
            }
        });
    });
  　if (membersInVoiceChannel.length > 0) {
     voice.start();
     console.log('人入ってたんでスタート');
     console.log('Members in voice channels on bot startup:', membersInVoiceChannel);
    } else {
     voice.stop();
     console.log("元からいなかったから止めた")
    }

});

client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member;
    const channel = newState.channel;

    if (!oldState.channel && channel) {
      // メンバーがボイスチャンネルに入室した場合
      if (!member.user.bot) {
        membersInVoiceChannel.push(member.id);
        console.log(`${member.displayName} joined voice channel`);
        if (channel.members.size === 1) {
          voice.start();
          console.log("人入ったんでスタート")
        }
      }
    } else if (oldState.channel && !channel) {
      　if (!member.user.bot)return
        // メンバーがボイスチャンネルから退出した場合
        membersInVoiceChannel = membersInVoiceChannel.filter(id => id !== member.id);
        console.log(`${member.displayName} left voice channel`);
    }
});

// 5分ごとにボイスチャンネルにいるメンバーをログに表示する
const voice = cron.schedule('*/1 * * * *', () => {
      // ボットがログインしたときに各ギルドのボイスチャンネルにいるメンバーを取得
    membersInVoiceChannel = [];
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if (channel.type === 'GUILD_VOICE' && channel.members.size > 0) {
                channel.members.forEach(member => {
                    // メンバーがボットではない場合のみIDを追加
                    if (!member.user.bot) {
                        membersInVoiceChannel.push(member.id);
                    }
                });
            }
        });
    });
  voiceleveling(membersInVoiceChannel, serverId)
});

//検索

client.on("messageCreate", async (message) => {
  // if (message.author.id !== "811186190707195906")return
  if (message.content === "cio!imgcirno") {
    const tas = await datas.get("day", 'task')
    console.log("imageCount:"+tas.data.img);
    if (tas.data.img >= 50) return message.channel.send(`今日はもうできないよ！`);
    
    const imageUrl = await searchImage();
    // const response = await Gimg.getimg()

    // 画像を送信
    tas.data.img++
    
    return console.log(imageUrl) 
    
    await datas.save(tas, 'task');
    const embed = new MessageEmbed()
      .setColor("#71C3FF")
      .setThumbnail(`${imageUrl}`)
      .setFooter({ text: `実行回数: ${tas.data.img}`});

    message.channel.send({ embeds: [embed] });
  }
});

//禁止ワード

client.on('messageCreate', async (message) => {
    if (message.content.startsWith('cio!out_word')) {
      const userid = message.author.id
      if (!userid.match(/888776652652441661|811186190707195906/)) return message.reply("no")
      const security = await datas.get("security", "ci_security") 
      const bannedWords = security.data.Out_words || []
      // コマンドの引数を取り出す
      const args = message.content.split(' ');
  
      // 引数が2つ以上の場合
      if (args.length >= 2) {
        // 2つ目の引数から最後の引数までループ
        for (let i = 1; i < args.length; i++) {
          // 配列にワードを追加
          if (bannedWords.includes(args[i])) {
              // すでに登録されている場合無視
              continue;
          }
          security.data.Out_words.push(args[i]);
        }
        
        await datas.save(security, "ci_security");
  
        // 登録完了メッセージを送信
        message.channel.send('ワードを登録しました。');
      } else {
          const security = await datas.get("security", "ci_security") 
          const bannedWords = security.data.Out_words || []
          if (bannedWords.length === 0) {
              message.channel.send('登録されたワードがありません。');
              return;
              }
          
              // Embedを作成
              const embed = new MessageEmbed()
              .setTitle('登録された禁止ワード')
              .setDescription(bannedWords.join('\n'));
          
              // Embedを送信
              message.channel.send({ embeds: [embed] });
      }
    }
    if (message.content.startsWith('cio!out_remove')) {
      const userid = message.author.id
      if (!userid.match(/888776652652441661|811186190707195906/)) return message.reply("no")
      const security = await datas.get("security", "ci_security") 
      const bannedWords = security.data.Out_words || []
      // コマンドの引数を取り出す
      const args = message.content.split(' ');
      if (bannedWords.length === 0) {
          message.channel.send('登録されたワードがありません。');
          return;
      }
  
      // 引数が2つ以上の場合
      if (args.length >= 2) {
        // 2つ目の引数から最後の引数までループ
        for (let i = 1; i < args.length; i++) {
          // 配列からワードを削除
          const index = bannedWords.indexOf(args[i]);
          if (index !== -1) {
              security.data.Out_words.splice(index, 1);
          }
        }

        await datas.save(security, "ci_security");
        // 削除完了メッセージを送信
        message.channel.send('ワードを削除しました。');
      } else {
        // 引数が不足している場合
        message.channel.send('引数が不足しています。');
      }
    }
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;
    const security = await datas.get("security", "ci_security") 
    const bannedWords = security.data.Out_words || []
    if (bannedWords.some(word => message.content.includes(word))) {
        try{
            // メッセージを削除
            message.delete();
        } catch(error) {
            console.log("タイムアウト失敗、原因：" + error.message)
        }
    }
});

//ここからfunkcionコーナー

// 画像検索を行う関数
async function searchImage() {
  const customSearch = google.customsearch('v1');
  const response = await customSearch.cse.list({
    cx: process.env.g_engine_id,
    q: "かわいいチルノ",
    auth: process.env.g_api_key,
  });
  // 最初の画像のURLを取得
  const imageUrl = response.data.items[0].link;

  const map = response.data.items.map(item => {
    return item.pagemap
  })
  console.log(map)
  return imageUrl;
}

//trea
function treaat (size) {
  let at = [0, 0, 0, 0]
  let l = size
  for(let j=0;j<4;j++){
    let i = Math.floor(Math.random() * (l - 1 + 1)) + 1;
    at[j] = i
  }
  return { x1:at[0], x2:at[1], y1:at[2], y2:at[3] }
}
function placeOnes(grid, positions, result) {
  grid[positions.x1-1][positions.y1-1] = ":red_circle:";
  if(result == true){
    grid[positions.x2-1][positions.y2-1] = "💰";
  }
  return grid
}
function createGrid(size) {
  let grid = [];
  for (let i = 0; i < size; i++) {
    grid.push(Array(size).fill(":brown_square:"));
  }
  return grid;
}
function gridToText(grid) {
  return grid.map(row => row.join('')).join('\n');
}
function calculateDistance(x1, y1, x2, y2) {
  const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  if (distance <= 2) return "🟥"
  if (distance <= 3) return "🟧"
  if (distance <= 5) return "🟨"
  if (distance >= 5) return "⬛"
}
function checkIfSameCoordinates(x1, y1, x2, y2) {
  return x1 === x2 && y1 === y2;
}

// shst
async function levelcount(message, itemKeys, newItems, LocationData, num, drop, str) {
  const bag = await datas.get("bag", message.author.id);
  const Cirno = await datas.get("user", message.author.id) 
  const s = await datas.get("day", message.author.id) 
  let user = Cirno.data.chara.lv
  let isMoon = Cirno.data.map.gotomoon === true ? true : false;
  let itemData = require('./items.json');
  let itemSummary = {}; // アイテムを集計するオブジェクト
  let rareWeight = LocationData.weight
  let xpToAdd = Math.floor(Math.random() * (user.giveXp.max - user.giveXp.min + 1)) + user.giveXp.min;
  let shstxp  = xpToAdd * 2
  let txpToAdd = xpToAdd * 2
  const addlog = [] //アイテム用
  
  let bufff = Cirno.data.buff || []
  
      if(bufff.length >= 1){
      for (let i of Cirno.data.buff){
        let buffoption
        let filteredArray = Cirno.data.buff
        let amount
        switch(i.id){
          case 2:
            buffoption = await buff.buff(i.id, xpToAdd)
            
            if (buffoption === undefined || buffoption == null) break
            
            shstxp *= 2
            txpToAdd *= 4
            

            i.duration--
            
            amount = i.duration
            
            if(i.duration <= 0){
              filteredArray = filteredArray.filter(obj => obj.id !== i.id);
            }
            Cirno.data.buff = filteredArray
            addlog.push(`${i.name}の効果で獲得経験値が上昇！(残り${amount}回)`)
            break;
          case 5:
            buffoption = await buff.buff(i.id, rareWeight)
            rareWeight = buffoption

            i.duration--
            
            amount = i.duration
            
            if(i.duration <= 0){
              filteredArray = filteredArray.filter(obj => obj.id !== i.id);
            }
            Cirno.data.buff = filteredArray
            addlog.push(`${i.name}の効果でレアドロップ率が上昇！(残り${amount}回)`)
            break;
        }
      }
    }
  console.log("レアドロップ率：", rareWeight)

  for (let i = 0; i < shstfor; i++) {
    const randomItemKey = itemKeys[Math.floor(Math.random() * itemKeys.length)];  
    const existingItem = bag.data.items.find(function(item) {
      return item.item.itemid === newItems[randomItemKey].itemid;
    });
    const itemDetail = itemData.items.find(item => item.itemid === newItems[randomItemKey].itemid);

    const randomValue = Math.random();
    let num;
    let drop = false;

    if (randomValue <= rareWeight) {
      num = {
        max: newItems[randomItemKey].rarenums.max,
        min: newItems[randomItemKey].rarenums.min
      };
      drop = true;
    } else {
      num = {
        max: newItems[randomItemKey].nums.max,
        min: newItems[randomItemKey].nums.min
      };
    }

    var nums = Math.floor(Math.random() * (num.max - num.min + 1)) + num.min;

    if (existingItem) { // 既存アイテムがあれば加算
      existingItem.item.num += nums;
    } else { // 新規アイテムを作成
      const newItemObj = {
        itemid: newItems[randomItemKey].itemid,
        num: nums,
      };    
      bag.data.items.push({ item: newItemObj });
    }

    // アイテム名ごとに集計
    const itemName = newItems[randomItemKey].name;
    if (itemSummary[itemName]) {
      itemSummary[itemName].num += nums;
    } else {
      itemSummary[itemName] = {
        num: nums,
        rarity: itemDetail.rarity
      };
    }
  }

  // 集計結果を文字列に変換してpush
  for (const itemName in itemSummary) {
    const item = itemSummary[itemName];
    let a = israreColor(itemName, item.num, item.rarity);
    str.push(a);
  }
  
  for(let log of addlog){
      str.push(log)
  }
  
  let a = ""

  console.log(xpToAdd)
  
  user.text.xp += txpToAdd;
  user.text.Totalxp += txpToAdd;
  user.text.seasonTotalxp += txpToAdd;
  user.probe.xp += shstxp;
  user.probe.Totalxp += shstxp;
  if (Cirno.data.chara.lv.probe.lv < 50 || (Cirno.data.chara.lv.probe.lv > 50 && isMoon === true)) { //５０Lvになったら止める
    while (user.probe.xp >= user.probe.Nextxp) {
      Cirno.data.chara.lv.probe.lv++;
      Cirno.data.chara.lv.probe.xp -= Cirno.data.chara.lv.probe.Nextxp;
      Cirno.data.chara.lv.probe.Nextxp = Math.floor(Cirno.data.chara.lv.probe.Nextxp * probebairitu(Cirno.data.chara.lv.probe.lv))
      client.channels.cache
            .get(lvupNotice)
            .send({content: `${message.member.displayName}の探索レベルが${Cirno.data.chara.lv.probe.lv}になったよ！` })
    } 
  }
  a = `${txpToAdd}[0;32mXP[0m\n${shstxp}[0;32m探索XP[0m`
  str.push(a)
  s.data.shst_day ++;
  Cirno.data.chara.User.TotalAction.numShst++
  Cirno.data.chara.lv = user
  await datas.save(s, message.author.id);
  await datas.save(Cirno, message.author.id);
  await datas.save(bag, message.author.id);
  return str
}

function probebairitu (lv) {
  let i
  if (lv >= 51){
    i = 1.08
  } else {
    i = 1.1
  }
  return i
}

// mapデータ取得
function searchMapData(A) {
  // "map"データ
  const mapData = require('./maps.json');

  let B = null; // Bの初期値をnullに設定

  // "map"内を検索
  for (const map of mapData.maps) {
    for (const location of map.location) {
      if (location.code === A) {
        B = {
          name: location.name,
          weight: location.rare,　//レア排出確率
          item: location.itemtable,
          rareitem: location.rareitemtable,
        };
        break; // 値が見つかったらループを終了
      }
    }
    if (B) {
      break; // 値が見つかったら外側のループも終了
    }
  }

  if (B) {
    return B; // 値が見つかった場合、オブジェクトを返す
  } else {
    console.log('値が見つかりませんでした。');
    // ここでアラートを出力するか、他の適切な処理を実行できます。
    return null; // 値が見つからない場合はnullを返す
  }
}
// itemtableからitemデータを取得
function getItemsByCode(table, raretable) {
  let itemData = require('./items.json');
  
  const itemtable = table
  const itemarray = itemtable.map(itemid => {
    const itemDetail = itemData.items.find(item => item.itemid === itemid);
    return itemDetail || null;
  });
  
  return itemarray.filter(item => item !== null); // nullのアイテムを除外して返します
}
// bagのページ分割
function paginateItems(items, itemsPerPage) {
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const paginatedItems = [];
  for (let page = 1; page <= totalPages; page++) {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    paginatedItems.push(items.slice(startIndex, endIndex));
  }

  return paginatedItems;
}

function getItemsForPage(paginatedItems, pageNumber) {
  if (pageNumber >= 1 && pageNumber <= paginatedItems.length) {
    return paginatedItems[pageNumber - 1];
  } else {
    return null; // 無効なページ番号の場合、空の配列を返す
  }
}

// レア度
function replaceCharacters(count) {
  // 指定された回数以上で文字を置き換える
  let result = '';
  let remainingCount = count;
  const replacements = ['<:rsr:1112071760620294164>', '<:gsr:1112071709630144635>', '<:nsr:1112071645444722688>'];

  while (remainingCount > 0) {
    if (remainingCount >= 11) {
      result += replacements[0];
      remainingCount -= 1;
    } else if (remainingCount >= 6) {
      result += replacements[1];
      remainingCount -= 1;
    } else {
      result += replacements[2];
      remainingCount -= 1;
    }
    if (result.length >= 130) {
      break;
    }
  }
  return result;
}
// 並び替え
var sortBy = function(array, order) {
/**
 * 二次元配列または連想配列の並び替え
 * @param {*[]} array 並び替える配列
 * @param {'ASC'|'DESC'} [order] 並び替える方法
 * @param {...*} args 並び替えの基準となるキー
 * @return {*[]} 並び替えられた配列
 */
	if (!order || !order.match(/^(ASC|DESC)$/i)) order = 'ASC';
	order = order.toUpperCase();

	var keys = [];
	for (var i = 2, len = arguments.length; i < len; i++) keys.push(arguments[i]);

	var targets = [].concat(array);

	targets.sort(function(a, b) {
		for (var i = 0, len = keys.length; i < len; i++) {
			if (typeof keys[i] === 'string') {
				if (order === 'ASC') {
					if (a[keys[i]] < b[keys[i]]) return -1;
					if (a[keys[i]] > b[keys[i]]) return 1;
				} else {
					if (a[keys[i]] > b[keys[i]]) return -1;
					if (a[keys[i]] < b[keys[i]]) return 1;
				}
			} else {
				var localOrder = keys[i].order || 'ASC';
				if (!localOrder.match(/^(ASC|DESC)$/i)) order = 'ASC';
				order = order.toUpperCase();

				if (localOrder === 'ASC') {
					if (a[keys[i].key] < b[keys[i].key]) return -1;
					if (a[keys[i].key] > b[keys[i].key]) return 1;
				} else {
					if (a[keys[i].key] > b[keys[i].key]) return -1;
					if (a[keys[i].key] < b[keys[i].key]) return 1;
				}
			}
		}

		return 0;
	});

	return targets;
};
// 探索
function convertMillisecondsToHMS(milliseconds) {
  const seconds = milliseconds / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;

  const remainingSeconds = Math.floor(seconds) % 60;
  const remainingMinutes = Math.floor(minutes) % 60;
  const remainingMilliseconds = (seconds - Math.floor(seconds)).toFixed(3);

  return {
    hours: Math.floor(hours),
    minutes: remainingMinutes,
    seconds: remainingSeconds,
    milliseconds: parseFloat(remainingMilliseconds),
  };
}
function getCurrentJapanTime() {
  const now = new Date();
  // Japan is in timezone UTC+9
  now.setHours(now.getHours() + 9);
  return now;
}
// 現在の日本時間とtimeObjectで計算した時間を合わせて表示する関数
function displayCombinedTime(timeObject) {
  const currentTime = getCurrentJapanTime();

  const combinedTime = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate(),
    currentTime.getHours() + timeObject.hours,
    currentTime.getMinutes() + timeObject.minutes,
    currentTime.getSeconds() + timeObject.seconds,
    currentTime.getMilliseconds() + Math.round(timeObject.milliseconds),
  );
  
  console.log("現在の日本時間:", currentTime.toLocaleString());
  console.log("合わせた時間:", combinedTime.toLocaleString());
  return combinedTime.toLocaleString()
}

// 3分刻みのあれ
function generateTimeArray() {
  const currentTime = getCurrentJapanTime();
  const timeArray = [];

  // 開始時刻を丸める（3分刻みにする）
  const startMinutes = Math.floor(currentTime.getMinutes() / 3) * 3;

  // 現在時刻からの経過時間を計算し、3分ごとの時間を生成
  for (let i = startMinutes; i < 60; i += 3) {
    const timeObject = convertMillisecondsToHMS(i * 60 * 1000); // 分をミリ秒に変換してconvertMillisecondsToHMSに渡す
    const combinedTime = new Date(
      currentTime.getFullYear(),
      currentTime.getMonth(),
      currentTime.getDate(),
      currentTime.getHours() + timeObject.hours,
      currentTime.getMinutes() + timeObject.minutes,
      currentTime.getSeconds() + timeObject.seconds,
      currentTime.getMilliseconds() + Math.round(timeObject.milliseconds)
    );

    timeArray.push(combinedTime.toLocaleString());
  }

  return timeArray;
}
//タスクセッティング
function getRandomTasks(count) {
  const shuffledTasks = dailyTasks.sort(() => 0.5 - Math.random());
  return shuffledTasks.slice(0, count);
}
async function tasksetting(tasknumber, userid, msg) {
  const Cirno = await datas.get("user", userid)
  const user = await datas.get("day", userid)
  const s = await datas.get("day", 'task')
  if (!user.data.task){ user.data.task = [] }
  if (findMatchingObject2(tasknumber, user.data.task) == true) {
    return; 
  } else {
    if (findMatchingObject(tasknumber, s.data.task) == true) {
      await msg.channel.send('課題達成！200XPゲット！');
      Cirno.data.chara.lv.text.xp += 200
      Cirno.data.chara.lv.text.Totalxp += 200
      Cirno.data.chara.lv.text.seasonTotalxp += 200;
      Cirno.data.chara.User.TotalAction.numTask++
      user.data.task.push(tasknumber)
      await datas.save(Cirno, userid)
      await datas.save(user, userid)
    } else {
      return;
    }
  }
}
function findMatchingObject(tasknumber, b) {
  return b.some(item => item.id == tasknumber);
}
function findMatchingObject2(tasknumber, b) {
  return b.some(item => item == tasknumber);
}

// buy setting
async function SetRandomBuy(count){
  let itemData = require('./items.json');
  const items = itemData.items.map(Item => {
    const { name, description, rarity, type, sell } = Item;
    
    const notFound = type.includes("notbuy");

    if(notFound) return null;
    
    return Item
  });
  const filteredItems = items.filter(item => item !== null);
  const id = filteredItems.map(item => { let {itemid} = item; return itemid})
  
  let itemArray = []
  for (let i = 0;i <= count; i++){
    const randomElement = getRandomElement(id);
    const existingItem = itemArray.find(function(item) {
      return item.itemid === randomElement;
    });
   if (existingItem) { //あったら
     if (randomElement == 10000011) {
     } else {
       existingItem.num += Math.floor(Math.random() * (10 - 3 + 1)) + 2;; //加算
     }
    } else {
      const newItemObj = { //なかったら新しく作って
      itemid: randomElement,
      num: 1,
    };    
      itemArray.push(newItemObj);
    }
  }
  
  
  return itemArray
}
// ランダムな要素を選ぶ関数
function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

function randomizeString(str) {
  const characters = str.split(''); // 文字列を1文字ずつの配列に分割
  const randomized = [];

  while (characters.length > 0) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomized.push(characters.splice(randomIndex, 1)[0]); // ランダムな位置の文字を配列に追加
  }

  return randomized;
}

function getArrayOrNull(array) {
  if (array.length === 0) {
    return null;
  }
  return array;
}
// test
async function MemberLevelReset(guild) {
  const members = await guild.members.fetch();
  const users = members.filter((member) => !member.user.bot);
  const userStats = [];

  for (const [memberId, member] of users) {
    const user = member.user;
    const userId = user.id;
    const nickname = member.nickname ?? user.username;
    
    const Cirno = await datas.get("user", userId)
    const rank = Cirno.data.chara.lv.text;
    
    userStats.push({ na: nickname, lv: rank.lv, to: rank.Totalxp });
  }

  return userStats;
}
// nums返し
function getItemNums(itemid) {
  const data = require('./items.json')
  const item = data.items.find(item => item.itemid === itemid);
  if (item) {
    return item.nums;
  } else {
    console.log(`アイテムID ${itemid} のアイテムが見つかりません。`);
    return null;
  }
}

// login計算
function isTwoDaysApart(date1, date2) {
  const oneDayMilliseconds = 24 * 60 * 60 * 1000; // 1日のミリ秒数
  const diffMilliseconds = Math.abs(date1 - date2); // 日付の差をミリ秒で計算

  const diffDays = Math.floor(diffMilliseconds / oneDayMilliseconds);

  return diffDays >= 2;
}

// レア度カラー
function israreColor(item, num, rare) {
  let i = "none"
  if(rare == 1 ||rare == 2) {
    i= `[1m${item}[0mを${num}個`
  } else if(rare == 3 ||rare == 4) {
    i= `[1;32m${item}[0mを${num}個`
  } else if(rare == 5 ||rare == 6 ||rare == 7 ||rare == 8) {
    i= `[1;36m${item}[0mを${num}個`
  } else if(rare == 9 ||rare == 10 ||rare == 11) {
    i= `[1;35m${item}[0mを${num}個`
  } else if(rare == 12 ||rare == 13 ||rare == 14) {
    i= `[1;33m${item}[0mを${num}個`
  } else if(rare >= 15) {
    i= `[1;31m${item}[0mを${num}個`
  } else {
    i= `${item}を${num}個`
  }
  return i
}

async function voiceleveling(ID, guildid){
  if (ID.length === 0) {
    voice.stop();
    return
  }
  const guild = await client.guilds.fetch(guildid);
  ID.forEach(async id => {
    const member = await guild.members.fetch(id);
    const Cirno = await datas.get("user", id);
    let user = Cirno.data.chara.lv
    const xpToAdd = Math.floor(Math.random() * (25 - 5 + 1)) + 5;
    user.voice.xp += xpToAdd;
    user.voice.Totalxp += xpToAdd;
    while (user.voice.xp >= user.voice.Nextxp) {
      Cirno.data.chara.lv.voice.lv++;
      Cirno.data.chara.lv.voice.xp -= Cirno.data.chara.lv.voice.Nextxp;
      Cirno.data.chara.lv.voice.Nextxp = Math.floor(Cirno.data.chara.lv.voice.Nextxp * 1.05)
      client.channels.cache
          .get(lvupNotice)
          .send({content: `${member.displayName}のボイスレベルが${Cirno.data.chara.lv.voice.lv}になったよ！` })
    }
    await datas.save(Cirno, id);
  })
  return
}

async function hasPermissions(message){
  const pers = ['BAN_MEMBERS', 'KICK_MEMBERS', 'MODERATE_MEMBERS', 'MANAGE_MESSAGES'];
  let Permission = false;
  for (const i of pers) {
    if (message.member.permissions.has(i)) {
      Permission = true;
      break;
    }
  }
  return Permission
}

const lvf = require("./level.js");
lvf.level();
const gen = require("./genso.js")
gen.genso();
const rol = require("./giveroles.js")
rol.role();
const ter = require("./ter.js")

const alc = require("./alch.js")
alc.alch();

client.login(process.env.TOKEN);
