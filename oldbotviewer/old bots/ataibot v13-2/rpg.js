const {
  Client,
  Intents,
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
  ],
  ws: { properties: { $browser: "Discord Android" } },
});
const Keyv = require("keyv");
const stages = new Keyv("sqlite://sqlite/rpg.sqlite", { table: "stages" });
const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
const levels = new Keyv("sqlite://sqlite/db.sqlite", { table: "lv" });
const chirno = new Keyv("sqlite://sqlite/rpg.sqlite", { table: "chirno" });
const enemys = new Keyv("sqlite://sqlite/rpg.sqlite", { table: "enemys" });
const bags = new Keyv("sqlite://sqlite/rpg.sqlite", { table: "bags" });
const trophys = new Keyv("sqlite://sqlite/db.sqlite", { table: "trophys" });
const bossnames = ["null" ,"美鈴", "レミリア", "神奈子", "エリー", "亜美", "魔王", "諏訪子"]
const bosshps = ['NaN' ,'1500', '2200', '3500', '5000', '7500', '10000', '15000']
const bossatks = ['NaN' ,'550', '1100', '1750', '2500', '3500', '4000', '5000']

exports.rpg = function () {
  client.on("messageCreate", async (message) => {
     if (message.author.id === "1005070509203017798")return;//すけ
     if (message.author.bot) return;
     if (message.channel.id !== "1025951215948943420") return;
     const level = (await levels.get(message.author.id)) || { count: 0, level: 1 };
     const stage = (await stages.get(message.author.id)) || { Lv: 1, boss: 0, count: 1, continue: 0, setup: 0, taiki: false };
     const status　= (await chirno.get(message.author.id)) || { hp: 0, ATK: 0 }
     const enemy = (await enemys.get(message.author.id)) || { hp: 0, ATK: 0 }
     const items = (await item.get(message.author.id)) || { osai_sen: 0 }
     const bag = (await bags.get(message.author.id)) || { ice: 0 }
     //プレイヤー情報を取得
     
     if (message.content === "ci!test") {
      if (message.author.id !== "811186190707195906")return message.reply("...?");
      console.log(`${stage.boss},${stage.Lv},${stage.count}`);
     }

     if (message.content.startsWith("ci!shop_ice")) {
       if (stage.setup !== 1) return message.channel.send("**ci!setup**をしよう！"); //setupして、どうぞ。
       const num = message.content.split(" ").slice(1).join(" ");
       if (!num) return message.channel.send("個数が入力されてないよ！");
       if(!isNaN(num)){
         if(items.osai_sen <= num * 25) return message.channel.send("お金が足りないよ！");
         message.channel.send("本当に購入する？=>”yes”と送信(制限時間5秒)");
         const filter = (msg) => msg.author.id === message.author.id;
         const collected = await message.channel.awaitMessages({ filter, max: 1, time: 5000 });
         const response = collected.first();
         if (!response) return message.channel.send("購入をキャンセルしたよ");
         if (!["yes"].includes(response.content)) return message.channel.send("購入をキャンセルしたよ");
         message.channel.send(`アイスを${num}個かったよ！(現在所持金${items.osai_sen}円)`);
         bag.ice += num * 1
         items.osai_sen -= num * 25
         item.set(message.author.id, items);
         bags.set(message.author.id, bag)
         console.log(`${bag.ice}`);
       } else {
         message.channel.send("数字を入力してね！");
       }
       
     }
     
     if (message.content === "ci!update"){
       const embed = new MessageEmbed()
       .setTitle("一部公開されてるコマンド")
       .addField("ci!setup", "せっとあっぷをするよ！")
       .addField("ci!atk, ci!attack", "攻撃をするよ！(先にsetupしないと反応しません。)")
       // 2022年12月15日
       .addField("ci!bag", "アイテムが確認できるよ！")
       .addField("ci!shop", "アイスが買えるよ！")
       .addField("ci!ice", "体力が回復できるよ！")
       .addField("ci!con", "敵の体力はそのままで復活できるよ！")
       .setColor("#71C3FF")
       .setTimestamp();
       message.channel.send({ embeds: [embed] });
     } //アップデート内容
     
     if (message.content === "ci!setup"){
       if (stage.setup == 1) return message.channel.send("できてるよー");
       // stages.clear(stage)
       status.hp = level.level * 50;
       status.ATK = level.level * 25;
       stage.count = 1;
       stage.boss = 0;
       stage.Lv = 1;
       stage.taiki = false
       enemy.hp = stage.count * 10 * stage.Lv;
       enemy.ATK = Math.floor(stage.count * 10 * stage.Lv / 2);
       stage.setup = 1;
       bag.ice = 10;
       message.channel.send("完了！");
       stages.set(message.author.id, stage);
       chirno.set(message.author.id, status);
       enemys.set(message.author.id, enemy);
       item.set(message.author.id, items);
       bags.set(message.author.id, bag)
     } //初期設定
     
     if (message.content === "ci!atk" || message.content === "ci!attack"　|| message.content === "あたっく"){
       if (stage.Lv == 7 && stage.boss == 1 && stage.count == 101) return message.channel.send("`もう敵がいない！`");
       if (stage.setup !== 1) return message.channel.send("**ci!setup**をしよう！"); //setupして、どうぞ。
       const status　= (await chirno.get(message.author.id)) || { hp: 0, ATK: 0 }
       const enemy = (await enemys.get(message.author.id)) || { hp: 0, ATK: 0 }
       if (status.hp <= 0 && stage.continue == 0) return message.channel.send("動けないよー...(泣)");
       var min = 1; var max = 100; var kri = Math.floor(Math.random() * (max + 1 - min)) + min; //クリティカルヒット
       var min2 = 1; var max2 = 100; var hzs = Math.floor(Math.random() * (max2 + 1 - min2)) + min2; //敵にかわされる
       if(hzs == 100){
         message.channel.send("```diff" + "\n" +"- こうげきをかわされてしまった...!```");
         atk = 0;
       } else if(kri == 100){
         let mi = level.level * 25; let ma = level.level * 25 * 2;
         var atk = Math.floor(Math.random() * (ma + 1 - mi)) + mi;
       } else {
         let mi = Math.floor(level.level * 25 / 2); let ma = level.level * 25;
         var atk = Math.floor(Math.random() * (ma + 1 - mi)) + mi;
       }
       enemy.hp = enemy.hp - atk;
       enemys.set(message.author.id, enemy);
       
       if (enemy.hp <= 0){
         message.reply("```diff" + "\n" +
                       `+ 敵に${atk}のダメージ！\n` + "```");  
         console.log(`${enemy.hp}`);
         if (stage.boss >= 1 && stage.count >= 100) { //次の作業場
           message.reply("```diff" + "\n" +
                       `+ あたいの大勝利！500XPゲット！\n` + "```"); 
           if (!stage.Lv >= 7) {
             message.reply("```diff" + "\n" +
                       `+ 全クリ！おめでとう！\n` + "```");
           } else {
             stage.count = 1;
             stage.boss = 0;
           }
             stage.Lv ++;
             stages.set(message.author.id, stage);
           
           enemyset()
         } else {
           message.reply("```diff" + "\n" +
                       `+ あたいの勝利！2XPゲット！\n` + "```");
           stage.count ++;
           stages.set(message.author.id, stage);
           enemyset()
         }
       }
       
       if (enemy.hp >= 0){
         var min2 = 1; var max2 = 100; var hzs = Math.floor(Math.random() * (max2 + 1 - min2)) + min2;
         if(hzs == 100){
           message.channel.send("```diff" + "\n" +"! チルノはこうげきを華麗にかわした！```");
           dmg = 0;
         } else {
           let mi3 = Math.floor(stage.count * 10 * stage.Lv / 4); let ma3 = Math.floor(stage.count * 10 * stage.Lv / 2);
           var dmg = Math.floor(Math.random() * (ma3 + 1 - mi3)) + mi3;
           status.hp -= dmg;
           chirno.set(message.author.id, status);
           console.log(`${status.hp},${dmg}`);
           
            if (stage.boss >= 1 && stage.count == 100) {
              message.reply("```diff" + "\n" +
                         `+ ${bossnames[stage.Lv]}に${atk}のダメージ！\n` + 
                         `+ ${bossnames[stage.Lv]}の残り体力 ${enemy.hp}/${bosshps[stage.Lv]}\n\n` +
                         `- チルノは${dmg}のダメージを負った。\n` +
                         `- チルノの残り体力 ${status.hp}/${level.level * 50}` + "```");
              
            } else {
              message.reply("```diff" + "\n" +
                         `+ 敵に${atk}のダメージ！\n` + 
                         `+ 敵の残り体力 ${enemy.hp}/${stage.count * 10 * stage.Lv}\n\n` +
                         `- チルノは${dmg}のダメージを負った。\n` +
                         `- チルノの残り体力 ${status.hp}/${level.level * 50}` + "```");
            }
           if (status.hp <= 0){
             message.reply("```diff" + "\n" +
                           `- チルノは力尽きた...\n` + "```");  
           }
         }
         enemys.set(message.author.id, enemy);
       }
       
     }
    
     if (message.content === "ci!ice" || message.content === "かいふく"){
       if (stage.setup !== 1) return message.channel.send("**ci!setup**をしよう！"); //setupして、どうぞ。
       if (bag.ice <= 0) return message.channel.send("```diff" + "\n" +`! アイスがない...!\n` + "```"); //（アイスが切れて）ないです
       if (status.hp >= level.level * 50) return message.channel.send("```diff" + "\n" +`! 体力は満タンだ...!\n` + "```"); //満タンっすよ～＾
       status.hp = level.level * 50
       bag.ice -= 1
       message.channel.send("```diff" + "\n" +`! 体力が回復した!(残り個数${bag.ice}個)\n` + "```");
       bags.set(message.author.id, bag)
       chirno.set(message.author.id, status);
     } 
       
     if (message.content === "ci!re" || message.content === "ci!reset"){
       if (stage.setup !== 1) return message.channel.send("**ci!setup**をしよう！"); //setupして、どうぞ。
       status.hp = level.level * 50;
       status.ATK = level.level * 25;      
       if (stage.boss == 1){
         enemy.hp = bosshps[stage.Lv]
         enemy.ATK = bossatks[stage.Lv]
         stage.continue = 1;
         stages.set(message.author.id, stage);
       } else {
         enemy.hp = stage.count * 10 * stage.Lv;
         enemy.ATK = Math.floor(stage.count * 10 * stage.Lv / 2);
       }
       chirno.set(message.author.id, status);
       enemys.set(message.author.id, enemy);
       message.channel.send("？？？「ザ・ワールド！..." + `${message.author}の時は戻る....」`);
     }
    
     if (message.content === "ci!con" || message.content === "ci!continue"){
       if (stage.setup !== 1) return message.channel.send("**ci!setup**をしよう！"); //setupして、どうぞ。
       if (stage.continue = 0) return message.channel.send("```diff" + "\n" +`! コンティニューができない...!\n` + "```");
       status.hp = level.level * 50
       status.ATK = level.level * 25;
       chirno.set(message.author.id, status);
       message.channel.send("```diff" + "\n" +`! 復活!\n` + "```");
     }
    
     function enemyset() {
       
       if (stage.count == 100) { //100体目だったらボス
         enemy.hp = bosshps[stage.Lv]
         enemy.ATK = bossatks[stage.Lv]
         status.hp = level.level * 50
         status.ATK = level.level * 25;
         stage.boss = 1
         stage.continue = 1;
         chirno.set(message.author.id, status);
         enemys.set(message.author.id, enemy);
         stages.set(message.author.id, stage);
         const enem = new MessageEmbed()
          .setTitle(`面ボスの${bossnames[stage.Lv]}あらわれた！`)
          .setColor("#71C3FF")
          .addFields({ name: `Lv.${stage.Lv}の${stage.count}体目の敵`, value: `> **体力**${enemy.hp}`})
          message.channel.send({ embeds: [enem] });
       } else { //でなければモンスター
         enemy.hp = stage.count * 10 * stage.Lv;
         enemy.ATK = Math.floor(stage.count * 10 * stage.Lv / 2);
         status.hp = level.level * 50
         status.ATK = level.level * 25;
         chirno.set(message.author.id, status);
         enemys.set(message.author.id, enemy);
         const enem = new MessageEmbed()
          .setTitle("新たな敵が現れた！")
          .setColor("#71C3FF")
          .addFields({ name: `Lv.${stage.Lv}の${stage.count}体目の敵`, value: `> **体力**${enemy.hp}`})
          message.channel.send({ embeds: [enem] });
       }
     }
  });
}

client.login(process.env.DISCORD_BOT_TOKEN);
