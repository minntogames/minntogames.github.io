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
  ThreadManager,
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
});
const cirno = require("./chara.json");
const datas = require("./mongoget.js");
const shstTimer = require("./index.js");
const Canvas = require("canvas");
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const timers = {};
const pingstop = {};
module.exports.timer = async function(id) {
 return timers[id];
}
module.exports.pingstop = async function(id) {
 return pingstop[id];
}
module.exports.ifping = async function(id) {
  delete pingstop[id]
  return;
}
exports.genso = function () {
  client.on("messageCreate", async (message) => {
    if (message.content === "cio!mmovstop") {
      if (!timers[message.author.id]) {
        return message.reply('いまいどうしてないぞ？');
        delete timers[message.author.id];
      }
      const timerInfo = timers[message.author.id];
      clearTimeout(timerInfo.timer); 
      delete timers[message.author.id]; 
      message.reply('いどうするのやめたよー。'); 
    }
    if (message.content.startsWith("cio!mmov")) {
      const Cirno = await datas.get("user", message.author.id)
      const cont1 = parseInt(message.content.split(" ").slice(1,2).join(" "), 10); 
      let shstlv = Cirno.data.chara.lv.probe.lv;
      let isMoon = Cirno.data.map.gotomoon === true ? true : false;
      if (!cont1){
        const re = await getAllMapData(isMoon, shstlv);
        const embed = new MessageEmbed().setTitle("ロケーションコード(ロケーション名：ID)").setColor("RANDOM")
        
        const groupedData = {};
        
        re.forEach(item => {
          if (!groupedData[item.mapName]) {
            groupedData[item.mapName] = [];
          }
          groupedData[item.mapName].push({ name: item.name, code: item.code });
        });

        for (const mapName in groupedData) {
          const locations = groupedData[mapName];
          const value = locations.map(location => `> ${location.name}：${location.code}`).join('\n');
          embed.addFields({ name: mapName, value: value ,inline: true });
        }
        return message.channel.send({ embeds: [embed] });
      } else if (cont1){
        let stim = await shstTimer.timer(message.author.id) || false
        if (message.author.id !== "811186190707195906" && cont1 === 9000000)return message.reply("Unexpected map code.\nThe fun with Nintendo is endless.\nLuigi is not part of this game.");
        if (timers[message.author.id]) { return message.reply(`移動中よ。`); }
        if (stim == true) return message.reply(`チルノは現在探索中よ。`);
        const Location = searchMapData(cont1)
        const check = checkLocationCode(cont1, isMoon, shstlv)
        if (Cirno.data.map.mapid === cont1) return message.reply(`既に${Location.name}にいるぞ？`);
        if (check == false) return message.channel.send("そのばしょはどこだ？知らないぞ？");
        if (Location == null) { message.channel.send("そのばしょはどこだ？知らないぞ？"); } else {
          const timerId = uuidv4();
          const time = adjustC(Cirno.data.map.mapid, cont1, 1000); //3600000
          const timeObject = convertMillisecondsToHMS(time);
          const jatime = displayCombinedTime(timeObject);
          message.channel.send(`${Location.name}に移動開始します。\n(移動完了予定時間：多分${timeObject.hours}時間${timeObject.minutes}分${timeObject.seconds}秒\n多分${jatime}に探索完了)`);
          
          const timer = setTimeout(() => {
            movedlocation(message.author.id, Location)
            message.reply(`${Location.name}に移動完了しました。`);
            delete timers[message.author.id];
          }, time);
          timers[message.author.id] = {
            name: Location.name,
            moveing: true,
            timerId: timerId,
            timer: timer,
          };
        }
      }
    }
    if (message.content === "cio!map") {
      // if (message.guildId === "1100357395244404756") return message.reply('めんてなんすにつき閉鎖中です');
      await ifmap(message.author.id)
      const Cirno = await datas.get("user", message.author.id)
      const bag = await datas.get("bag", message.author.id)
      const day = await datas.get("day", message.author.id)
      const map = searchMapData(Cirno.data.map.mapid)
      const embed = new MessageEmbed()
        .setTitle("読み込み中...")
        .setColor("RANDOM")
      const msg = await message.channel.send({ embeds: [embed] });
      const canvas = Canvas.createCanvas(1366, 736);
      const ctx = canvas.getContext("2d");
      const background = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/new/map2.png");
      const backmoon = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/new/moonmap.jpg");
      const mark = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/new/now2.png")
      const shsting = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/new/shst2.png")
      
      if (Cirno.data.map.mapid >= 5000000){
        ctx.drawImage(backmoon, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      }
      
      let stim = await shstTimer.timer(message.author.id) || false
      
      let a = stim.shsting == true ? shsting : mark;
      ctx.beginPath();
      if (!map){
        ctx.drawImage(mark, 683, 368, 50, 50);
      } else {
        ctx.drawImage(a, map.x, map.y, 50, 50);
      }
      ctx.closePath();
      
      const attachment = new MessageAttachment(canvas.toBuffer(), "map.png");
      
      embed.setTitle("MAP情報")
      if (!Cirno.data.map.mapid){
        embed.addFields({ name: '現在の位置', value: "無名の丘" })
      } else {
        const st = stim.shsting == true ? "探索中":"待機中";
        const d = day.data.shst_day == null ? "0": day.data.shst_day ;
        embed.addFields({ name: '現在の位置', value: `${map.name}` },
                        { name: '状態', value: `${st}、探索回数：${d}／5`})
      }
      
      
      msg.edit({ embeds: [embed] });
      message.channel.send({ files: [attachment] });
      tasksetting(4, message.author.id, message)
    }
  });
};

function getmapDataFromJSON(filePath, map) {
  // ファイルの読み込み
  const data = fs.readFileSync(filePath, 'utf8');

  try {
    // JSONデータのパース
    const jsonData = JSON.parse(data);

    // アイテムの名前を取得
    const mapdata = jsonData.map[map]

    return mapdata;

  } catch (error) {
    console.error('JSONデータのパースエラー:', error);
    return null;
  }
}

//ロケーションコードの詳細取得
function searchMapData(A) {
  // "map"データ
  const mapData = require('./maps.json');

  let B = null; // Bの初期値をnullに設定

  // "map"内を検索
  for (const map of mapData.maps) {
    for (const location of map.location) {
      if (location.code === A) {
        B = {
          mapid: map.mapid,
          code: location.code,
          name: location.name,
          x: location.x,
          y: location.y
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
//ロケーションコード全取得
function getAllMapData(isMoon, shstlv) {
  // "map"データ
  const mapData = require('./maps.json');

  const result = [];

  // "map"内のデータをループ
  for (const map of mapData.maps) {
    const mapName = map.mapname;
    const mapId = map.mapid;

    // Cが0の場合は特定の"mapid"内の"code"をスキップ
    if (isMoon === false && mapId === 5 || mapId === 6 ) {
      continue;
    }

    for (const location of map.location) {
      let islevel = ""
      if (location.level == shstlv) islevel = "(NEW!)"
      const code = location.code;
      const name = `${location.name}${islevel}`;
      const level = location.level;
      
      if (shstlv < level) continue;
      // "mapname"と"location"の"code"と"name"をオブジェクトに格納し、結果の配列に追加
      result.push({ mapName, code, name });
    }
  }

  return result;
}
//getAllMapDataしかなかったもの選別
function checkLocationCode(D, isMoon, shstlv) {
  const allMapData = getAllMapData(isMoon, shstlv); // 0は特定の"mapid"をスキップする場合の例です

  let isFound = false;

  for (const data of allMapData) {
    if (data.code === D || D === 9000000) {
      isFound = true;
      break;
    }
  }

  if (!isFound) {
    console.log(`location.code ${D} が見つかりませんでした。`);
    return false;
  }
}

function adjustC(a, b, c) {
  const diff = Math.abs(a - b);
  
  if (diff >= 10000){
    c = diff
  }
  
  if (diff < 10) {
    c *= 0.5;
  } else {
    c *= 2;
  }
  
  c = Math.ceil(c);
  if (b == 9000000) c = 0
  return c;
}

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

// 現在の日本時間を取得する関数
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

async function tasksetting(tasknumber, userid, msg) {
  const Cirno = await datas.get("user", userid)
  const user = await datas.get("day", userid)
  const s = await datas.get("day", 'task')
  if (!user.data.task){ user.data.task = [] }
  if (findMatchingObject2(tasknumber, user.data.task) == true) {
    return; 
  } else {
    if (findMatchingObject(tasknumber, s.data.task) == true) {
      msg.reply('課題達成！200XPゲット！');
      Cirno.data.chara.User.TotalAction.numTask++
      Cirno.data.chara.lv.text.xp += 200
      Cirno.data.chara.lv.text.Totalxp += 200
      Cirno.data.chara.lv.text.seasonTotalxp += 200;
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

async function movedlocation (id, Location){
  const Cirno = await datas.get("user", id)
  Cirno.data.map.name = Location.name
  Cirno.data.map.mapid = Location.code
  datas.save(Cirno, id); 
}

async function ifmap(id, a) {
  const user = await datas.get("day", id)
  user.data.ifping = true
  await datas.save(user, id)
}

client.login(process.env.TOKEN);