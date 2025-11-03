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
const datas = require("../mongoget.js");

module.exports = {
	data: {
    name: "ci-login",
    description: "ログインボーナスを受け取ります。",
    },
  async execute(interaction) {
    const s = await datas.get("day", interaction.user.id) 
      const bag = await datas.get("bag", interaction.user.id) 
      const Cirno = await datas.get("user", interaction.user.id) 
      
      if (s.data.login_day >= 1) {
        return interaction.reply("今日のログインボーナスはもうもらったよ〜");
      }
      
      const LoginNowDate = new Date();
      let Now = new Date(LoginNowDate.getTime() + (9 * 60 * 60 * 1000)); // 9時間をミリ秒単位で加算
      if (!Cirno.data.login || !Cirno.data.login.lastLoginDate) {
        Cirno.data.login = { 
          "bairitu": 0, 
          "lastLoginDate": "" 
        }
        await datas.save(Cirno, interaction.user.id);
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
        interaction.reply("ボーナス倍率がリセットされました...");
        console.log("倍率リセット完了");
      }
      
      if (Cirno.data.login.bairitu <= 5)Cirno.data.login.bairitu += 0.1
      
      Cirno.data.login.lastLoginDate = LoginNowDate
      
      var max = Math.floor(200 * Cirno.data.login.bairitu)
      console.log(max);
      const nums = Math.floor(Math.random() * (max - 50 + 2)) + 1;
      
      var existingItem = bag.data.items.find(function(item) {
        return item.item.itemid === 10000000;
      });
      
      let login_text = "ログイン！"
      if(interaction.user.id !== "811186190707195906") login_text = "こんにちは～♡"//エイプリルフール
      let a = Cirno.data.login.bairitu;
      const embed = new MessageEmbed()
      .setTitle("ログイン！")
      .addFields({ name: 'おこずかい', value: nums + `円\n(${existingItem.item.num}円 → ${existingItem.item.num+=nums}円)`  },
                 { name: '倍率', value: `x` + a.toFixed(1) + `${a <= 5 ? "" : "(**MAX!**)"}`})
      if (existingItem) {
        existingItem.item.num += nums;
      } else {
        var newItem = {
          "itemid": 10000000,
          "num": nums
        };
        bag.data.items.push({ item: newItem });
      }　

      interaction.reply({ embeds: [embed] });
      
      if(!Cirno.data.chara.User.TotalAction.numLogin) Cirno.data.chara.User.TotalAction.numLogin = 1
      Cirno.data.chara.User.TotalAction.numLogin++
      
      s.data.login_day = 1
      
      await datas.save(s, interaction.user.id);
      await datas.save(bag, interaction.user.id);
      await datas.save(Cirno, interaction.user.id);
      
      tasksetting(6, interaction.user.id, interaction)
  },
};

// login計算
function isTwoDaysApart(date1, date2) {
  const oneDayMilliseconds = 24 * 60 * 60 * 1000; // 1日のミリ秒数
  const diffMilliseconds = Math.abs(date1 - date2); // 日付の差をミリ秒で計算

  const diffDays = Math.floor(diffMilliseconds / oneDayMilliseconds);

  return diffDays >= 2;
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