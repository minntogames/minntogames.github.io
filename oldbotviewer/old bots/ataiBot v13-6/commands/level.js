const {
  Client,
  Intents,
  MessageEmbed,
  MessageActionRow,
  MessageAttachment,
  MessageButton,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
  Discord,
} = require("discord.js");

const Canvas = require("canvas");
const extras = require("canvas-extras");
const datas = require("../mongoget.js");

module.exports = {
	data: {
    type: "SUB_COMMAND",
    name: "ci-level-card",
    description: "ランクカードを取得します。",
    options: [{
      type: "USER",
      name: "target",
      description: "表示するユーザー",
      }],
    },
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    if (user.id === "1100063626339045516") return interaction.reply("あたいはさいきょーだかられべるは存在しないよ！o(`･ω´･+o) ﾄﾞﾔｧ…！");
    if (user.bot) return interaction.reply("Botは指定出来ないよー");
    const Cirno = await datas.get("user", user.id)
    const guild = interaction.guild;
    const members = await guild.members.fetch();
    const users = members.filter((member) => !member.user.bot); // Botを除外する
    const userStats = [];
    for (const [memberId, member] of users) {
      const user = member.user;
      const userId = user.id;
      const nickname = member.nickname ?? user.username; // ニックネームがある場合は、それを使用し、それ以外の場合はユーザー名を使用する

      const Cirno = await datas.get("user", userId)
      const rank = Cirno.data.chara.lv.text

      userStats.push({ na: nickname, xp: rank.xp, lv: rank.lv });
    }
    const result = sortBy(userStats, "DESC", "lv", "xp", "na");
    const name = `${user.username}`;
    const resultIndex = searchObjectByPropertyValue(result, "na", name);
    const rank = Cirno.data.chara.lv.text
    const probe = Cirno.data.chara.lv.probe
    const voice = Cirno.data.chara.lv.voice

    var kmtb = formatNumber(rank.Nextxp);
    var skmtb = formatNumber(probe.Nextxp);
    const canvas = Canvas.createCanvas(700, 350);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/new/card.png");
    const avatar = await Canvas.loadImage(user.displayAvatarURL({ format: "png" }));

    ctx.drawImage(background, 0, 0, canvas.width, canvas.height); //後ろの背景
    ctx.strokeStyle = "#71c3ff";

    ctx.font = applyText(canvas, `${name}`); //ユーザー名
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${name}`, canvas.width / 16.5, canvas.height / 4);
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#66fffc";
    ctx.fillText(`Lv ${rank.lv}  To:${rank.Totalxp}XP`, canvas.width / 8, canvas.height / 2.45);
    ctx.fillText(`Lv ${voice.lv}  To:${voice.Totalxp}XP`, canvas.width / 8, canvas.height / 1.62);
    ctx.fillText(`Lv ${probe.lv}  To:${probe.Totalxp}XP`, canvas.width / 8, canvas.height / 1.25);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.font = "28px sans-serif";

    ctx.beginPath();
    ctx.progressBar(rank.xp, rank.Nextxp, canvas.width / 8, canvas.height / 2.4, 350, 30, Cirno.data.setting.Usercolor, "dimgray");
    var kmtb = formatNumber(rank.Nextxp);
    ctx.strokeText( `XP${rank.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 2.05);
    ctx.fillText( `XP${rank.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 2.05);

    ctx.beginPath();
    ctx.progressBar(voice.xp, voice.Nextxp, canvas.width / 8, canvas.height / 1.6, 350, 30, Cirno.data.setting.Usercolor, "dimgray");
    var kmtb = formatNumber(voice.Nextxp);
    ctx.strokeText( `XP${voice.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 1.44);
    ctx.fillText( `XP${voice.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 1.44);

    ctx.beginPath();
    ctx.progressBar(probe.xp, probe.Nextxp, canvas.width / 8, canvas.height / 1.23, 350, 30, Cirno.data.setting.Usercolor, "dimgray");
    var kmtb = formatNumber(probe.Nextxp);
    ctx.strokeText( `XP${probe.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 1.13);
    ctx.fillText( `XP${probe.xp}/${kmtb}`, canvas.width / 7.5, canvas.height / 1.13);

    ctx.beginPath();
    ctx.arc(580, 125, 105, 0, Math.PI * 2, true);
    ctx.fillStyle = Cirno.data.setting.Usercolor
    ctx.fill("evenodd");

    ctx.beginPath();
    ctx.arc(580, 125, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, 480, 25, 200, 200);

    const attachment = new MessageAttachment( canvas.toBuffer(), "level.png");
    
    return interaction.reply({ files: [attachment] });
  },
};

const applyText = (canvas, text) => {
  const context = canvas.getContext("2d");
  let fontSize = 60;
  do {
    context.font = `${(fontSize -= 8)}px sans-serif`;
  } while (context.measureText(text).width > canvas.width - 300);

  return context.font;
};

function formatNumber(number) {
    if (number < 1000) {
        return number.toString();
    }

    const units = ["k", "m", "b", "t", "p", "e", "z"];
    const decimals = [2, 1, 0];

    let unitIndex = 0;
    while (number >= 1e3 && unitIndex < units.length) {
        number /= 1e3;
        unitIndex++;
    }

    const decimalIndex = Math.floor(Math.log10(number));
    const fixedDecimals = decimals[Math.max(decimalIndex, 0)];

    return number.toFixed(fixedDecimals) + (unitIndex > 0 ? units[unitIndex - 1] : "");
}

var sortBy = function (array, order) {
  /**
 * 二次元配列または連想配列の並び替え
 * @param {*[]} array 並び替える配列
 * @param {'ASC'|'DESC'} [order] 並び替える方法
 * @param {...*} args 並び替えの基準となるキー
 * @return {*[]} 並び替えられた配列
 */
  if (!order || !order.match(/^(ASC|DESC)$/i)) order = "ASC";
  order = order.toUpperCase();

  var keys = [];
  for (var i = 2, len = arguments.length; i < len; i++) keys.push(arguments[i]);

  var targets = [].concat(array);

  targets.sort(function (a, b) {
    for (var i = 0, len = keys.length; i < len; i++) {
      if (typeof keys[i] === "string") {
        if (order === "ASC") {
          if (a[keys[i]] < b[keys[i]]) return -1;
          if (a[keys[i]] > b[keys[i]]) return 1;
        } else {
          if (a[keys[i]] > b[keys[i]]) return -1;
          if (a[keys[i]] < b[keys[i]]) return 1;
        }
      } else {
        var localOrder = keys[i].order || "ASC";
        if (!localOrder.match(/^(ASC|DESC)$/i)) order = "ASC";
        order = order.toUpperCase();

        if (localOrder === "ASC") {
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

function searchObjectByPropertyValue(array, property, searchStr) {
  for (let i = 0; i < array.length; i++) {
    const value = array[i][property];
    if (value && value.includes(searchStr)) {
      return i;
    }
  }
  return -1;
}