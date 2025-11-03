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
  MessageAttachment,
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
const Keyv = require("keyv");
// const levels = new Keyv("sqlite://sqlite/db.sqlite", { table: "lv" });
const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
const settings = new Keyv("sqlite://sqlite/db.sqlite", { table: "settings" });
const trophys = new Keyv("sqlite://sqlite/db.sqlite", { table: "trophys" });
const scores = new Keyv("sqlite://sqlite/db.sqlite", { table: "scores" });
const levels = new Keyv("sqlite://sqlite/db.sqlite", { table: "levels" });
const xps = new Keyv("sqlite://sqlite/db.sqlite", { table: "xps" });
const Canvas = require("canvas");
const extras = require("canvas-extras");
const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "DD";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();
const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });

exports.level = function () {

  client.on("messageCreate", async (message) => {
    if (message.author.id === "1005070509203017798")return;//すけ
    if (message.author.bot) return;
    
    // const level = (await levels.get(message.author.id)) || { count: 0, level: 1 };
    const lvs = (await levels.get(message.author.id)) || { [sid]: 0 }
    const xs = (await xps.get(message.author.id))|| { [sid]: 0 }
    const time = formatToTimeZone(now, FORMAT, { timeZone: TIME_ZONE_TOKYO });
    var sid = message.guild.id
    
    if(!lvs[sid]) {
      lvs[sid] = 1
      xs[sid] = 0
      xps.set(message.author.id, xs);
      levels.set(message.author.id, lvs); 
    }
    
    if(time == '09' || time == '19' || time == '29'){
    var min = 2;
    var max = 4;
    var sai = Math.floor(Math.random() * (max + 1 - min)) + min;
    } else {
    var min = 1;
    var max = 2;
    var sai = Math.floor(Math.random() * (max + 1 - min)) + min;
    }
    // level.count += sai * 1;
    xs[sid] += sai * 1;
    if (xs[sid] >= lvs[sid] * 25 && lvs[sid] <= 2827) {
      for(;;){
        xs[sid] -= lvs[sid] * 25;
        lvs[sid] += 1;
        if (xs[sid] <= lvs[sid] * 25) {
          break;
        }
      }
      client.channels.cache.get("1020902799275474965").send( `${message.author.tag}のレベルが${lvs[sid]}になったよ！`);
    }
    // levels.set(message.author.id, level);
    // console.log(`I:${message.author.id} L:${lvs[sid]} X:${xs[sid]}`);
    xps.set(message.author.id, xs);
    levels.set(message.author.id, lvs);

    // みんなが使えるやつ
    if (message.content === "ci!lvs") {
      const trophy = (await trophys.get(message.author.id)) || { dfg: false ,ktr: false};
      const items = (await item.get(message.author.id)) || { osai_sen: 0 };
      const score = (await scores.get(message.author.id)) || { all_ping: 0 };
      const setting = (await settings.get(message.author.id)) || { user_color: '#71C3FF' };
      // if(message.author.id !== "811186190707195906") return message.reply("...?")

      const canvas = Canvas.createCanvas(700, 250);
      const ctx = canvas.getContext("2d");
      const background = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/pro_2.png");
      const ico_dfg = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/dfg_ico.png");
      const ico_ktr = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/ktr_ico.png");
      const ad = await Canvas.loadImage("https://minntogames.github.io/atai-bot.github.io/administrator.png");
      
      const avatar = await Canvas.loadImage(message.author.displayAvatarURL({ format: "jpg" }));

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#71c3ff";

      ctx.font = applyText(canvas, `${message.member.displayName}`);
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `${message.member.displayName}`, canvas.width / 16.5, canvas.height / 3 );

      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `Lv ${lvs[sid]}`, canvas.width / 16.5, canvas.height / 2.2 );

      ctx.font = "30px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText( `所持金 ${items.osai_sen}円`, canvas.width / 3.5, canvas.height / 2.2 );

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
      
      // if (message.author.id === "811186190707195906"){
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

      message.reply({ files: [attachment] });
    }
    if (message.content.startsWith("ci!icoc")) {
      const items = (await item.get(message.author.id)) || { osai_sen: 0, waku_change: 0 };
      if (items.osai_sen <= 25){
        message.channel.send("おこずかいがたりないよー");
        return
      } else {
        const setting = (await settings.get(message.author.id)) || { user_color: '#71C3FF' };
        const co = message.content.split(" ").slice(1).join(" ");
      if (!co) return message.channel.send("カラーコードを入力してね！(HEX, https://g.co/kgs/2keeot)");
      if (items.waku_change >= 0){
        items.waku_change -= 1;
      } else {
        items.osai_sen -= 25;
      }
      item.set(message.author.id, items);
      setting.user_color = co; 
      settings.set(message.author.id, setting);
      message.channel.send(`設定されたよ！（所持金${items.osai_sen}円、券${items.waku_change}枚）`);
      return;
     }
    }        
    if (message.content.startsWith("ci!ranking")) {
      const text = message.content.split(" ").slice(1).join(" ");
      const members = await message.guild.members.fetch()
      const tags = members.map(member => member.user.id)
      const names = members.map(member => member.user.tag)
      const array = []
      if (!text || text == "lv") {
        for (let i = 0;i <= tags.length; ++i){
          const lvs = (await levels.get(tags[i])) || { [sid]: 0 }
          const xs = (await xps.get(tags[i]))|| { [sid]: 0 }
          // if (level.level >= 1){
          array.push({ Lv: lvs[sid] ,Na: names[i], XP: xs[sid]});
          // }
        }
       var result = sortBy(array, 'DESC', 'Lv', 'XP', 'Na');
       console.log(result);
       const rank = new MessageEmbed()
              .setAuthor({ name: 'レベルランキング🏆' })
              .addFields({ name: '上位10位のひと！', value: 
                         `#1|${result[0].Na}：Lv${result[0].Lv}\n
                          #2|${result[1].Na}：Lv${result[1].Lv}\n
                          #3|${result[2].Na}：Lv${result[2].Lv}\n
                          #4|${result[3].Na}：Lv${result[3].Lv}\n
                          #5|${result[4].Na}：Lv${result[4].Lv}\n
                          #6|${result[5].Na}：Lv${result[5].Lv}\n
                          #7|${result[6].Na}：Lv${result[6].Lv}\n
                          #8|${result[7].Na}：Lv${result[7].Lv}\n
                          #9|${result[8].Na}：Lv${result[8].Lv}\n
                          #10|${result[9].Na}：Lv${result[9].Lv}
                          ` })
              .setColor("#71C3FF")
              .setTimestamp();
       message.channel.send({ embeds: [rank] });
       }
      if (text == "wallet") {
        for (let i = 0;i <= tags.length; ++i){
          const items = (await item.get(tags[i])) || { osai_sen: 0 };
          array.push({ Os: items.osai_sen ,Na: names[i] });
        }
        var result = sortBy(array, 'DESC', 'Os', 'Na');
          const rank = new MessageEmbed()
            .setAuthor({ name: '所持金ランキング🏆' })
            .addFields({ name: '上位10位のひと！', value: 
                       `#1|${result[0].Na}：${result[0].Os}円\n
                        #2|${result[1].Na}：${result[1].Os}円\n
                        #3|${result[2].Na}：${result[2].Os}円\n
                        #4|${result[3].Na}：${result[3].Os}円\n
                        #5|${result[4].Na}：${result[4].Os}円\n
                        #6|${result[5].Na}：${result[5].Os}円\n
                        #7|${result[6].Na}：${result[6].Os}円\n
                        #8|${result[7].Na}：${result[7].Os}円\n
                        #9|${result[8].Na}：${result[8].Os}円\n
                        #10|${result[9].Na}：${result[9].Os}円
                          ` })
              .setColor("#71C3FF")
              .setTimestamp();
       message.channel.send({ embeds: [rank] });
      }
      if (text == "allping") {
        for (let i = 0;i <= tags.length; ++i){
          const score = (await scores.get(tags[i])) || { all_ping: 0 };
          array.push({ Os: score.all_ping ,Na: names[i] });
        }
        var result = sortBy(array, 'DESC', 'Os', 'Na');
          const rank = new MessageEmbed()
            .setAuthor({ name: '総Pingランキング🏆' })
            .addFields({ name: '上位10位のひと！', value: 
                       `#1|${result[0].Na}：${result[0].Os}ms\n
                        #2|${result[1].Na}：${result[1].Os}ms\n
                        #3|${result[2].Na}：${result[2].Os}ms\n
                        #4|${result[3].Na}：${result[3].Os}ms\n
                        #5|${result[4].Na}：${result[4].Os}ms\n
                        #6|${result[5].Na}：${result[5].Os}ms\n
                        #7|${result[6].Na}：${result[6].Os}ms\n
                        #8|${result[7].Na}：${result[7].Os}ms\n
                        #9|${result[8].Na}：${result[8].Os}ms\n
                        #10|${result[9].Na}：${result[9].Os}ms
                          ` })
              .setColor("#71C3FF")
              .setTimestamp();
       message.channel.send({ embeds: [rank] });
      }
    }
    if (message.content === "ci!trophy") {
      const trophy = (await trophys.get(message.author.id)) || { ktr: false, dfg: false, cfg: false, kmz: false, kmk: false, yky: false, imo: false, kdn: false, moj: false, swk: false };
      const troem = new MessageEmbed().setTitle("とろふぃー一覧！")
      if (trophy.ktr == true ){ troem.addField("【カタツムリ】[★★☆☆☆]", "200pingを100回取った") } else { troem.addField("【？？？？？】[★★☆☆☆]", "200pingを...？") }
      if (trophy.dfg == true ){ troem.addField("【大富豪】　　[★★☆☆☆]", "所持金が100万を超えた") } else { troem.addField("【？？？】　　[★★☆☆☆]", "所持金が...？") }
      if (trophy.cfg == true ){ troem.addField("【超富豪】　　[★★★★☆]", "所持金が1億を超えた") } else { troem.addField("【？？？】　　[★★★★☆]", "所持金がさらに...？") }
      if (trophy.kmz == true ){ troem.addField("【霧の湖】　　[★☆☆☆☆]", "KKDで霧の湖を突破した") } else { troem.addField("【？？？】　　[★☆☆☆☆]", "KKD(カエル凍らせ大作戦)で...？") }
      if (trophy.kmk == true ){ troem.addField("【紅魔館】　　[★☆☆☆☆]", "KKDで紅魔館を突破した") } else { troem.addField("【？？？】　　[★☆☆☆☆]", "KKDで...？") }
      if (trophy.yky == true ){ troem.addField("【妖怪の山】　[★★☆☆☆]", "KKDで妖怪の山を突破した") } else { troem.addField("【？？？？】　[★★☆☆☆]", "KKDで...？") }
      if (trophy.imo == true ){ troem.addField("【異門】　　　[★★☆☆☆]", "KKDで異門を突破した") } else { troem.addField("【？？】　　　[★★☆☆☆]", "KKDで...？") }
      if (trophy.kdn == true ){ troem.addField("【氷の毒沼】　[★★★☆☆]", "KKDで氷の毒沼を突破した") } else { troem.addField("【？？？？】　[★★★☆☆]", "KKDで...？") }
      if (trophy.moj == true ){ troem.addField("【魔王城】　　[★★★★☆]", "KKDで魔王城を突破した") } else { troem.addField("【？？？】　　[★★★★☆]", "KKDで...？") }
      if (trophy.swk == true ){ troem.addField("【新魔王】　　[★★★★★]", "KKDで真の黒幕を撃破した") } else { troem.addField("【？？？】　　[★★★★★]", "KKDで...？") }
      troem.setColor("#71C3FF")
      message.channel.send({ embeds: [troem] });
    }
    
    // 使えないやつ
    if (message.content.startsWith("ci!XC")) {
    if (message.author.id !== "811186190707195906")return
    const uid = message.content.split(" ").slice(1,2).join(" ");
    const lv = message.content.split(" ").slice(2,3).join(" ");
    const xp = message.content.split(" ").slice(3).join(" ");
    if (!uid || !lv || !xp ) return message.channel.send("ci!osa_s [id] [nan]");
    if(!isNaN(uid) || !isNaN(lv) || !isNaN(xp)){
    lvs[sid] = 1 * lv;
    xs[sid] = 1 * xp;
    levels.set(uid, lvs);
    xps.set(uid, xs)
    message.channel.send('ID:<@' + uid +'>\n変更後Lv:' + lv + '\n変更後XP:' + xp );
  } else {
    message.channel.send("数字を入力してね！");
  }
    } //XP, Lv変更
    if (message.content.startsWith("ci!lx_k")) {
    if (message.author.id !== "811186190707195906")return message.reply("...?");
    const uid = message.content.split(" ").slice(1).join(" ");
    if (!uid) return message.channel.send("ci!lx_k [id]");
    var num_u = uid;
    if(!isNaN(num_u)){
      const level = (await levels.get(uid)) || { count: 0, level: 1 };
      const items = (await item.get(uid)) || { osai_sen: 0 };
      const lvs = (await levels.get(uid))|| { [message.guild.id]: 0 };
      const xs = (await xps.get(uid))
      message.channel.send(`ID:【${uid}】\n` + 
                           `現在のLv: [${lvs[sid]}]\n` +
                           `現在のXP: [${xs[sid]} / ${lvs[sid] * 25}]\n` +
                           `所持金: [${items.osai_sen}]`);
    } else {
      message.channel.send("数字を入力してね！");
    }
    } //他の人のLvなどを確認
  });
};

/**
 * 二次元配列または連想配列の並び替え
 * @param {*[]} array 並び替える配列
 * @param {'ASC'|'DESC'} [order] 並び替える方法
 * @param {...*} args 並び替えの基準となるキー
 * @return {*[]} 並び替えられた配列
 */
var sortBy = function(array, order) {
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

const applyText = (canvas, text) => {
    const context = canvas.getContext("2d");
    let fontSize = 60;
    do {
      context.font = `${(fontSize -= 8)}px sans-serif`;
    } while (context.measureText(text).width > canvas.width - 300);

    return context.font;
  };

client.login(process.env.DISCORD_BOT_TOKEN);