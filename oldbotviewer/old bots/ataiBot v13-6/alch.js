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
  ThreadManager,
  Events,
  Guilds,
  Discord,
} = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES, "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES",],
});
client.setMaxListeners(0);

const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
      moment.tz.setDefault('Asia/Tokyo'); // タイムゾーンを日本に設定
const fs = require("fs");

const itemData = require('./items.json')
const datas = require("./mongoget.js");

exports.alch = function () {
  client.on('messageCreate', async (message) => {
    if (message.content.startsWith("cio!alch")) {
      try {
        const cont1 = parseInt(message.content.split(" ").slice(1,2).join(" "), 10); 
        if (!cont1){
          const Cirno = await datas.get("user", message.author.id)
          if(!Cirno.data.alch) return;
          if(Cirno.data.alch.ing.length === 0) return message.reply(`現在錬金中の物はありません。`);
          let mapped = Cirno.data.alch.ing.map(slot => {
            const existingItem = itemData.items.find(function(item) {
              return item.itemid === slot.id
            });
            let currentDate = new Date(slot.EndDate);
            let endtime = Math.floor(currentDate.getTime() / 1000);
            return `${existingItem.name}：終了予定時間：<t:${endtime}:F>(<t:${endtime}:R>)`
          })
          message.reply(`現在錬金中\n${mapped.join("\n")}`)
        } else if(cont1) {
          const Cirno = await datas.get("user", message.author.id)
          if(!Cirno.data.alch) return;
          let currentDate = new Date()
          if(!Cirno.data.alch.ing[cont1-1]) return message.reply("現在そのスロットは空です。")
          if(checkTimePassed(currentDate, Cirno.data.alch.ing[cont1-1].EndDate)){
            const bag = await datas.get("bag", message.author.id)
            const existingItem = bag.data.items.find(function(item) {
              return item.item.itemid === Cirno.data.alch.ing[cont1-1].id;
            });

            const existingItem2 = itemData.items.find(function(item) {
              return item.itemid === Cirno.data.alch.ing[cont1-1].id;
            });

            if (existingItem2.alch.num == undefined||!existingItem2) return message.reply(`問題が生じました。Bot主にご連絡ください。`)
            if (existingItem) { //あったら
              existingItem.item.num += existingItem2.alch.num; //加算
            } else {
              const newItemObj = { //なかったら新しく作って
              itemid: Cirno.data.alch.ing[cont1-1].id,
              num: existingItem2.alch.num,
            };    
              bag.data.items.push({ item: newItemObj });
            }

            Cirno.data.alch.ing.splice(cont1-1, 1);
            await Promise.all([
              datas.save(Cirno, message.author.id),
              datas.save(bag, message.author.id)
            ]);

            return message.reply(`錬金終了！${existingItem2.name}を${existingItem2.alch.num}個ゲット！`)
          } else {
            let currentDate = new Date(Cirno.data.alch.ing[cont1-1].EndDate);
            let endtime = Math.floor(currentDate.getTime() / 1000);
            return message.reply(`そのスロットはまだ錬金中です。(終了予定時間：<t:${endtime}:F>(<t:${endtime}:R>))`)
          }
        }
      } catch (err){
        console.error(err)
      }
    }
  });
}

// functions

function checkTimePassed(A, B) {
  const timeA = new Date(A);
  const timeB = new Date(B);

  if (timeA > timeB) {
    return true
  } else {
    return false
  }
}

client.login(process.env.TOKEN);