
const Discord = require('discord.js')// on_message.js
const http = require("http");
const cron = require("node-cron");
const querystring = require("querystring");
const discord = require("discord.js");
const client = new discord.Client();


const name = "message";

var prefix = "ci!";

const handler = (message) => {
  if (message.content === `${prefix}ping`) {
    message.channel.send("Pong.");
  } else if (message.content === `${prefix}beep`) {
    message.channel.send("Boop.");
  }
};

client.on("message", (message) => {
  if (message.author.id == client.user.id || message.author.bot) {
    return;
  }

  //メンション

  if (message.isMemberMentioned(client.user)) {
    sendReply(message, "あたいのこと呼んだ？");
    return;
  }

  //挨拶

  if (
    message.content.match(
      /よろしくお願いします|よろしくです|よろしくおねがいします|よろしくお願いいたします|よろしくおねがいいたします/
    )
  ) {
    let text = "よろしくね！";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match(/おはよう|おはようございます/)) {
    let arr = ["おはよう！今日は何して遊ぶ？", "おっはよー！"];
    lottery(message.channel.id, arr);
    return;
  }
  if (message.content.match(/こんにちは/)) {
    let text = "あそぼー！";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match(/こんばんは/)) {
    let text =
      "こんばんは！眠たくなってきたね...(*ᴗ₄ᴗ)⁾⁾ ﾊｯ!? 寝てないよ！？(； ・`ω・´)";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.match(/おやすみ|おやすみなさい/)) {
    let text = "おやすみー！明日も遊ぼうね！";
    sendMsg(message.channel.id, text);
    return;
  }

  //ci! コマンド

  if (message.content.startsWith(prefix + "チルノ")) {
    let text = "あたいのこと呼んだ？";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.startsWith(prefix + "さいきょー")) {
    let text = "あたいったらさいきょーね！";
    sendMsg(message.channel.id, text);
    return;
  }
  if (message.content.startsWith(prefix + "大好き")) {
    sendReply(message, "ありがとう！(*^▽^*)あたいもあなたが好きよ！");
    return;
  }
  if (message.content.startsWith(prefix + "ハグ")) {
    sendReply(message, "(っ,,>ω<)ω<,,`)はぐ～");
    return;
  }
  if (message.content.startsWith(prefix + "疲れた")) {
    sendReply(message, "大丈夫？");
    return;
  }
  if (message.content.startsWith(prefix + "emozi")) {
    let arr = [
      "<:__:966285207328141332>",
      "<:emoji_1:895991748013203456>",
      "<:emoji_10:956320449548140554>",
      "<:emoji_11:964493942991249448>",
      "<:emoji_12:964497524520017941>",
      "<:emoji_15:969165427689267210>",
      "<:emoji_16:977461160741863434>",
      "<:emoji_17:982854072140980224>",
      "<:emoji_18:982854946162610256>",
      "<:emoji_19:982855810130542632>",
      "<:emoji_2:901610692824694854>",
      "<:emoji_3:902530244991418378>",
      "<:emoji_4:902871696321695784>",
      "<:emoji_5:912338481425039381>",
      "<:emoji_6:918996430679605258>",
      "<:emoji_7:940743492798394368>",
      "<:emoji_8:940743528441606195>",
      "<:emoji_9:940743566190342156>",
      "<:emoji_20:982858112576917544>",
    ];
    lottery(message.channel.id, arr);
  } else if (message.isMemberMentioned(client.user)) {
  }

  if (message.content.startsWith(prefix + "ping")) {
    message.channel.sendMessage(
      "あなたの送信速度は`" +
        `${Date.now() - message.createdTimestamp}` +
        " ms`よ！"
    );   
    
  }
});
// おみ

client.on("message", (message) => {
  if (message.content === "ci! omi") {
    var array = [
      "**大ちゃん！** \nだいすき！",
      "**るーみあ！** \nそーなのかー",
      "**ちるの！** \nあたい！",
      "**れいむ！**　\nひえぇ",
      "**みすちー！**　\nだいすき！",
    ];
    message.channel.send(array[Math.floor(Math.random() * array.length)]);
    console.log(array[Math.floor(Math.random() * array.length)]);
  }
});

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.log("DISCORD_BOT_TOKENが設定されていません。");
  process.exit(0);
}

// 
client.on('message', async message =>{
  if (message.content === "ci!kk0"){
    let arr = ["ハズレだよ...", "あたり！"];
    let weight = [1, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});


client.on('message', async message =>{
  if (message.content === "ci!kk1"){
    let arr = ["ハズレだよ...", "あたり！"];
    let weight = [9, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk2"){
    let arr = ["ハズレだよ...", "おおあたり！"];
    let weight = [99, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk3"){
    let arr = ["ハズレだよ...", "おおあたり！！！！！！！！！！！！！さいきょうね！"];
    let weight = [999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk4"){
    let arr = ["(4)ハズレだよ...", "(4)ちょうあたり！！！！！！！！！！！！！けんじゃめざせるわよあんた"];
    let weight = [9999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
  
});

client.on('message', async message =>{
  if (message.content === "ci!kk5"){
    let arr = ["(5)ハズレだよ...", "(5)ちょうおおあたり！！！！！！！！！！！！！あんたなにもんよ..."];
    let weight = [99999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk6"){
    let arr = ["(6)ハズレだよ...", "(6)さいきょー！！！！！！！！！！！！！"];
    let weight = [999999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk7"){
    let arr = ["(7)ハズレだよ...", "(7)さいきょー！！！！！！！！！！！！！"];
    let weight = [9999999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk8"){
    let arr = ["(8)ハズレだよ...", "(8)さいきょー！！！！！！！！！！宝くじかってみたら？"];
    let weight = [99999999, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

client.on('message', async message =>{
  if (message.content === "ci!kk9"){
    let arr = ["(9)ハズレだよ...", "(9)あてるのはあきらめたほうがみのためよ。", "(9)あなた前世神だった？"];
    let weight = [599999999, 400000000, 1];
    lotteryByWeight(message.channel.id, arr, weight);
  }
});

function lotteryByWeight(channelId, arr, weight){
  let totalWeight = 0;
  for (var i = 0; i < weight.length; i++){
    totalWeight += weight[i];
  }
  let random = Math.floor( Math.random() * totalWeight);
  for (var i = 0; i < weight.length; i++){
    if (random < weight[i]){
      sendMsg(channelId, arr[i]);
      return;
    }else{
      random -= weight[i];
    }
  }
  console.log("lottery error");
}
// 
  client.on('message', message => {
    if (message.content === 'ci!help') {
      const embed = new Discord.RichEmbed()
        .setTitle('**なにかわからないことあったらここでみてね！**')
        .addField('**反応系コマンド**', '> ci!チルノ ,さいきょー ,大好き ,ハグ ,疲れた')
        .addField('**お遊び系コマンド**', '> ci!emozi ,ci! omi ,ping ,kk(0~9)')
        .setColor('RANDOM')
        .setTimestamp()
  
      message.channel.send(embed)
    }
  })

// 

client.login(process.env.DISCORD_BOT_TOKEN);

function sendReply(message, text) {
  message
    .reply(text)
    .then(console.log("リプライ送信: " + text))
    .catch(console.error);
}

function sendMsg(channelId, text, option = {}) {
  client.channels
    .get(channelId)
    .send(text, option)
    .then(console.log("メッセージ送信: " + text + JSON.stringify(option)))
    .catch(console.error);
}
function lottery(channelId, arr) {
  let random = Math.floor(Math.random() * arr.length);
  sendMsg(channelId, arr[random]);
}

module.exports = { name, handler };
