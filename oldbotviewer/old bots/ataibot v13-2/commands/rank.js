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
const Keyv = require("keyv");
const trophys = new Keyv("sqlite://sqlite/db.sqlite", { table: "trophys" });
const levels = new Keyv("sqlite://sqlite/db.sqlite", { table: "levels" });
const xps = new Keyv("sqlite://sqlite/db.sqlite", { table: "xps" });
const scores = new Keyv("sqlite://sqlite/db.sqlite", { table: "scores" });
const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
const settings = new Keyv("sqlite://sqlite/db.sqlite", { table: "settings" });
const Canvas = require("canvas");
const extras = require("canvas-extras");
const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "DD";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();
const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });

module.exports = {
	data: {
        name: "rank",
        description: "レベルを確認できるよ！",
    },
	async execute(interaction) {
    
        const applyText = (canvas, text) => {
    const context = canvas.getContext("2d");
    let fontSize = 60;
    do {
      context.font = `${(fontSize -= 8)}px sans-serif`;
    } while (context.measureText(text).width > canvas.width - 300);

    return context.font;
    };
    var sid = interaction.guild.id
    const lvs = (await levels.get(interaction.user.id)) || { [sid]: 0 }
    const xs = (await xps.get(interaction.user.id))|| { [sid]: 0 }
    const score = (await scores.get(interaction.user.id)) || { all_ping: 0 };
    const trophy = (await trophys.get(interaction.user.id)) || { dfg: false ,ktr: false};
    const items = (await item.get(interaction.user.id)) || { osai_sen: 0 };
    const setting = (await settings.get(interaction.user.id)) || { user_color: '#71C3FF' };
    const now = new Date();
    const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });

    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext("2d");
    const background = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/pro_2.png");
    const ico_dfg = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/dfg_ico.png");
    const ico_ktr = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/ktr_ico.png");
    const ad = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/administrator.png");
      
    const avatar = await Canvas.loadImage(interaction.user.displayAvatarURL({ format: "jpg" }));

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#71c3ff";

      ctx.font = applyText(canvas, `${interaction.member.displayName}`);
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `${interaction.member.displayName}`, canvas.width / 16.5, canvas.height / 3 );

      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `Lv ${lvs[sid]}`, canvas.width / 16.5, canvas.height / 2.2 );

      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `所持金 ${items.osai_sen}円`, canvas.width / 3.5, canvas.height / 2.2 );

      ctx.font = "30px sans-serif";
      ctx.strokeStyle = "#71c3ff";
      ctx.fillText( `XP${xs[sid]}/${lvs[sid] * 25}`, canvas.width / 16.5, canvas.height / 1.7 );
      
      ctx.beginPath();
      ctx.progressBar(xs[sid], lvs[sid] * 25, canvas.width / 16.5, canvas.height / 2, 400, 25, setting.user_color, "dimgray");
    
      ctx.font = "28px sans-serif";
      ctx.strokeStyle = "#000000";
      ctx.strokeText(`XP${xs[sid]}/${lvs[sid] * 25}`, canvas.width / 14, canvas.height / 1.7 );
      ctx.strokeStyle = setting.user_color;
      ctx.fillText( `XP${xs[sid]}/${lvs[sid] * 25}`, canvas.width / 14, canvas.height / 1.7 );
    
      if(time == '09' || time == '19' || time == '29'){
      ctx.font = "20px sans-serif";
      ctx.strokeStyle = "#71c3ff";
      ctx.strokeText('⑨Day!', 0, 20);
      ctx.strokeStyle = "#0000ff";
      ctx.fillText( `⑨Day!`, 0, 20 );
      }
      
      ctx.beginPath();
      ctx.arc(580, 125, 105, 0, Math.PI * 2, true);
      ctx.fillStyle = setting.user_color;
      ctx.fill('evenodd');
      
      if (trophy.dfg == true){ctx.drawImage(ico_dfg, 40, 195, 32, 32);}
      
      if (trophy.ktr == true){ctx.drawImage(ico_ktr, 80, 195, 32, 32);}
      
      // if (interaction.user.id === "811186190707195906"){
      //   ctx.drawImage(ad, 40, 150, 32, 32);
      //   ctx.font = "25px sans-serif";
      //   ctx.fillStyle = "#00ff89";
      //   ctx.fillText('Administrator', 80, 175);
      // }
      
      var alp = abbreviateNumber(score.all_ping)
      
      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `総Ms ${alp}Ms`, canvas.width / 16.5, 180 );
    
      ctx.beginPath();
      ctx.arc(580, 125, 100, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 480, 25, 200, 200);

      const attachment = new MessageAttachment(canvas.toBuffer(), "level.png");

      await interaction.reply({ files: [attachment]});
    
  }
}

function abbreviateNumber(value) {
    var newValue = value;
    if (value >= 1000) {
        var suffixes = ["", "K", "M", "B","T"];
        var suffixNum = Math.floor( (""+value).length/3 );
        var shortValue = '';
        for (var precision = 2; precision >= 1; precision--) {
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            var dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');
            if (dotLessShortValue.length <= 2) { break; }
        }
        if (shortValue % 1 != 0)  shortValue = shortValue.toFixed(1);
        newValue = shortValue+suffixes[suffixNum];
    }
    return newValue;
}