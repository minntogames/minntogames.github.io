const cirno = {
  lv: {
    text: { xp: 0, level: 1, requiredXP: 100, Toxp: 0, minxp: 5, maxxp: 25 },
    voice: { xp: 0, level: 1, requiredXP: 50, Toxp: 0 },
    probe: { xp: 0, level: 1, requiredXP: 100, Toxp: 0 },
  },
  map: { Location: 0, name: "無名の地", x: 0 ,y: 0, item: [] },
  login: { bairitu: 0, lastLoginDate: "" },
  setting: { color: "#66fffc", l_notice: "false",twoping: 0, threeping: 0, maxping: 0 },
  banlevel: { lv: 0 }, //lv0:NoBan lv1:SoftBan lv2:Ban
  name: "null"
};
const

client.on("messageCreate", async (message) => {
  var ping = Date.now() - message.createdTimestamp;
  if (!message.guild || message.author.bot) return;
  const bag = (await bags.get(message.author.id))|| { items: [] };
  const s = (await Days.get(message.author.id))|| { ping_day: 0, shst_day: 0, login_day: 0 }; 
  const Cirno = (await Users.get(message.author.id))|| cirno
  var existingItemName = "さいきょう玉";
  var existingItemId = 1;
  var addNum = 1;
  if (message.content === 'ci!ping') {
    if (message.guildId === "1100357395244404756") return
    if (!Cirno.setting.twoping || !Cirno.setting.threeping ) {
      Cirno.setting.twoping = 0;
      Cirno.setting.threeping = 0;
    await Users.set(message.author.id, Cirno);
    }
    if (message.channel.id === pingchannel && s.ping_day >= 1) {
      return message.reply("今日はもうやったよー");
    } else {
      message.reply("あなたの送信速度は`" + `${ping}` + " ms`よ！");
      if (ping >= 300){ // オリロール
        message.reply("ping値**300**超え！");  
        if (message.channel.id === pingchannel) { 
          const embed = new MessageEmbed()
            .setTitle(`${message.author}` + "\n300Pingのお知らせ")
            .addFields( { name: 'ユーザー名', value: "> " + `${message.author.tag}` },
                        { name: 'PING値', value: "> " + `${ping}`, inline: true }, 
                        { name: '300ping合計', value: "> " + `${Cirno.setting.threeping + 1}`, inline: true },)
            .setColor("#71C3FF").setTimestamp();
          client.channels.cache.get(pingmsg).send({ embeds: [embed] });
          if (Cirno.setting.maxping <= ping || !Cirno.setting.maxping){
            Cirno.setting.maxping = ping
          }
          Cirno.setting.threeping ++;
          await Users.set(message.author.id, Cirno);
          s.ping_day = 1
          Days.set(message.author.id, s);
          return;
        }
      } else if (ping >= 200) {
        message.reply("ping値**200**超え！");    
        if (message.channel.id === pingchannel) { 
          const embed = new MessageEmbed()
            .setTitle(`${message.author}` + "\n200Pingのお知らせ")
            .addFields( { name: 'ユーザー名', value: "> " + `${message.author.tag}` },
                        { name: 'PING値', value: "> " + `${ping}`, inline: true }, 
                        { name: '200ping合計', value: "> " + `${Cirno.setting.twoping + 1}`, inline: true },)
            .setColor("#71C3FF").setTimestamp();
          client.channels.cache.get(pingmsg).send({ embeds: [embed] });
          var existingItem = bag.items.find(function(item) {
            return item.item.name === existingItemName || item.item.itemid === existingItemId;
          });
          if (existingItem) {
            existingItem.item.num += addNum;
            Cirno.setting.twoping ++;
            Cirno.lv.text.maxxp += addNum;
            await Users.set(message.author.id, Cirno);
            await bags.set(message.author.id, bag);
            message.reply("そしてさいきょう玉を一つ手に入れた！");
          } else {
            var newItem = {
            itemid: 1,
            name: "さいきょう玉",
            rarity: 2,
            num: 1,
            description: "とても最強に見える玉。なんか獲得できそうなものが増えそうだ。"
          };
            bag.items.push({ item: newItem });
            Cirno.setting.twoping ++;
            Cirno.lv.text.maxxp += addNum;
            await Users.set(message.author.id, Cirno);
            await bags.set(message.author.id, bag);
            message.reply("そしてさいきょう玉を一つ手に入れた！");
          }　
        }
      }
      if (Cirno.setting.maxping <= ping || !Cirno.setting.maxping){
        Cirno.setting.maxping = ping
      }
      s.ping_day = 1
      await Users.set(message.author.id, Cirno);
      await Days.set(message.author.id, s);
    }
  }
});


client.on('messageCreate', async (message) => {
    if (message.content === 'ci!login') {
      const s = await datas.get("day", message.author.id) 
      const bag = await datas.get("bag", message.author.id) 
      const Cirno = await datas.get("user", message.author.id) 
      if (s.data.login_day >= 1) return message.reply("今日のログインボーナスはもうもらったよ〜");
      const currentDate = new Date();
      if (!Cirno.data.login || !Cirno.data.login.lastLoginDate) {
        Cirno.data.login = { 
          "bairitu": 0, 
          "lastLoginDate": "" 
        }
        await datas.save(Cirno, message.author.id);
      }
      const lastLoginDate = new Date(Cirno.data.login.lastLoginDate);
      const LOGIN_STREAK_THRESHOLD = 2; // ボーナス倍率リセットの閾値
      
      if (!Cirno.data.login.bairitu) {
        Cirno.data.login.bairitu = 0.9
        console.log("倍率設定完了"); 
      } else if (!lastLoginDate || getDayDifference(currentDate, lastLoginDate) >= LOGIN_STREAK_THRESHOLD || lastLoginDate.getMonth() !== currentDate.getMonth()){     
        Cirno.data.login.bairitu = 0.9
        message.reply("倍率がリセットされました...");
        console.log("倍率リセット完了");
      }
      
      Cirno.data.login.bairitu += 0.1
      Cirno.data.login.lastLoginDate = currentDate
      var max = Math.floor(100 * Cirno.data.login.bairitu)
      console.log(max);
      const nums = Math.floor(Math.random() * (max - 10 + 1)) + 1;
      console.log("データ設定完了");
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
      let a = Cirno.data.login.bairitu;
      message.reply(`今日のログインボーナス(${nums}円)をゲット！(現在のログボ倍率${a.toFixed(1)}倍)`);
      s.data.login_day = 1
      await datas.save(s, message.author.id);
      await datas.save(bag, message.author.id);
      await datas.save(Cirno, message.author.id);
      tasksetting(6, message.author.id, message)
    }
  });

[

]

[
  { "name": "ci-twitter-Url-Conversion", "date": "2023/08/13" },
  { "name": "ci-item-sell", "date": "2023/10/01" },
  { "name": "ci-rank-card", "date": "2023/10/01" },
  { "name": "ci-usericon", "date": "2023/04/28" },
  { "name": "ci-join-bot-official-server", "date": "2023/10/01" },
  { "name": "ci-Auto-Twitter-Url-Conversion", "date": "2023/08/14" },
  { "name": "ci-levelup-notice", "date": "2023/04/28" },
  { "name": "ci-urlshort", "date": "2023/04/29" },
  { "name": "ci!janken", "date": "2023/07/25" },
  { "name": "ci!task", "date": "2023/07/31" },
  { "name": "ci!mmovstop", "date": "2023/07/31" },
  { "name": "ci!status", "date": "2023/10/31" },
  { "name": "ci!shgu", "date": "2023/05/28" },
  { "name": "ci!user", "date": "2023/04/27" },
  { "name": "ci!mmov", "date": "2023/05/31" },
  { "name": "ci!icoc", "date": "2023/05/28" },
  { "name": "ci!level", "date": "2023/04/27" },
  { "name": "ci!map", "date": "2023/05/31" },
  { "name": "ci!help", "date": "2023/07/26" },
  { "name": "ci!ranking", "date": "2023/05/28" },
  { "name": "ci!login", "date": "2023/06/03" },
  { "name": "ci!shst", "date": "2023/05/28" },
  { "name": "ci!bag", "date": "2023/05/28" },
  { "name": "ci!graf", "date": "2023/07/26" },
  { "name": "ci!ping", "date": "2023/05/28" },
]

[
  {
    "name": "ci!help",
    "description": "現在見ているものがhelpです",
    "usage": "ci!help <pageNum>"
  },
  {
    "name": "ci!level",
    "description": "あなたのLvを確認します。/n他にも色々確認できます。",
    "usage": "ci!level"
  },
  {
    "name": "ci!ranking",
    "description": "ランキングを表示します。\nページも指定できます。",
    "usage": "ci!ranking <num/str[T,P,V]> <str?num>"
  },
  {
    "name": "ci!graf",
    "description": "ランキングを可視化させたものです。",
    "usage": "ci!graf"
  },
  {
    "name": "ci!user",
    "description": "自分の情報が確認できます。",
    "usage": "ci!user"
  },
  {
    "name": "ci!icoc",
    "description": "rankcardなどの枠色を自分のイメージカラーに合わせることができます。",
    "usage": "ci!icoc <ColorCode>"
  },
  {
    "name": "ci!bag",
    "description": "所持品を確認することができます。ソート機能もついています。",
    "usage": "ci!bag <num>"
  },
  {
    "name": "ci!shst",
    "description": "チルノが各地域を探索する機能です。\n一日５回まで探索に行かせることが可能です。",
    "usage": "ci!shst"
  },
  {
    "name": "ci!shgu",
    "description": "探索を断念します。これによる回数制限は減りません。\nまた、探索が終了した瞬間shstを行うと高確率で不具合が起こります。\nもしそうなった場合はshguを使いましょう。",
    "usage": "ci!shgu"
  },
  {
    "name": "ci!ping",
    "description": "サーバーからの応答速度を返します。遅ければ遅いほどいいものがもらえます。\nちなみにですがあなたの所の回線を重くしても変化はないです。",
    "usage": "ci!ping"
  },
  {
    "name": "ci!login",
    "description": "1日1回、お金がもらえます。",
    "usage": "ci!login"
  },
  {
    "name": "ci!map",
    "description": "現在地を確認することが可能です",
    "usage": "ci!map"
  },
  {
    "name": "ci!mmov",
    "description": "特定のキーを含めて送信するとその地域に移動することができます。/nキーなしでコマンドを送信すると地域のキー一覧が確認できます",
    "usage": "ci!mmov　<key>"
  },
  {
    "name": "URL",
    "description": "discordのURLを送信するとそのメッセージ内容が確認できます。\nまた、URLの後に数字を含めると画像のn枚目を指定することができます。",
    "usage": "<msgURL>　<num>"
  },
  {
    "name": "ci!task",
    "description": "その日の課題を確認することができます",
    "usage": "ci!task"
  },
  {
    "name": "ci!janken",
    "description": "チルノとじゃんけんをします。",
    "usage": "ci!janken"
  },
  {
    "name": "ci!mmovstop",
    "description": "他地域への移動を断念します。",
    "usage": "ci!mmovstop"
  },
  {
    "name": "ci!status",
    "description": "taskやログイン状況などが確認できます。",
    "usage": "ci!status"
  },
  {
    "name": "ci-twitter-Url-Conversion",
    "description": "ツイッターのURLを変換します。",
    "usage": "<comannd> <url>"
  },
  {
    "name": "ci-item-sell",
    "description": "探索でゲットしたアイテム等が売れます。",
    "usage": "ci-item-sell"
  },
  {
    "name": "ci-rank-card",
    "description": "ci!levelの移植です",
    "usage": "<comannd> <?user>"
  },
  {
    "name": "ci-usericon",
    "description": "めんばーのアイコンが拡大表示されます",
    "usage": "ci-usericon <?user>"
  },
  {
    "name": "ci-join-bot-official-server",
    "description": "botが運営されている鯖の招待リンクを開きます",
    "usage": "ci-join-bot-official-server"
  },
  {
    "name": "ci-auto-twitter-url-conversion",
    "description": "twitterurlの自動変換機能の設定をします",
    "usage": "<command> <on/off> <auto-delete> <auto-fixed> <destination>"
  },
  {
    "name": "ci-levelup-notice",
    "description": "レベルアップ通知の設定をします",
    "usage": "<command> <on/off>"
  },
  {
    "name": "ci-urlshort",
    "description": "URLを変換します。",
    "usage": "<command> <url> <?ephemeral>"
  },
]