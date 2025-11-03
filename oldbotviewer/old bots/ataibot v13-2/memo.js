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

client.on("messageCreate", async (message) => {
  const day = (await pings.get(message.author.id)) || { count: 0 };
  const count = (await counts.get(message.author.id)) || { ping_count: 0 };
  if (message.content === "ci!ping") {
    ping = Date.now() - message.createdTimestamp;
    if (message.author.bot) return;
    
    var ping = 0;
    const score = (await scores.get(message.author.id)) || { all_ping: 0 };
    score.all_ping += ping;
    scores.set(message.author.id, score);
    
    const day = (await pings.get(message.author.id)) || { count: 0 };
    if (message.channel.id === "1001491412992405505" && day.count >= 1) {
      message.reply("今日はもうやったよー");
      return;
    } else {
      message.reply("あなたの送信速度は`" + `${ping}` + " ms`よ！");
      console.log(`▶ ${message.author.tag}のping値${ping}, allping:${score.all_ping}ms`); // ～ping値をLogsに出力
      if (message.channel.id === "1001491412992405505") {
        day.count = 1;
        pings.set(message.author.id, day);
        console.log(`ok,${day.count}`);
      }
      if (ping >= 200) {
        // ～もしpingが200超えたなら
        message.reply(`200超え！(合計200ping回数${count.ping_count + 1}回)`);
        const embed = new MessageEmbed()
          .setTitle(`${message.author}` + "\nがping値" + `${ping}` + "を出しました！")
          .addFields( { name: 'ユーザー名', value: "> " + `${message.author.tag}` }, { name: '場所', value: "> [" + `${message.guild.name}` + "]の[" + `${message.channel.name}` + "]" }, { name: 'PING値', value: "> " + `${ping}`, inline: true }, { name: '200ping合計', value: "> " + `${count.ping_count + 1}`, inline: true },)
          .setColor("#71C3FF")
          .setTimestamp(); //引数にはDateオブジェクトを入れることができる。何も入れないと今の時間になる

        client.channels.cache
          .get("1048947447881269379")
          .send({ embeds: [embed] });
        
        if (message.channel.id === "1001491412992405505" && count.ping_count >= 1) {
         const lvs = (await levels.get(message.author.id))
    　　　const xs = (await xps.get(message.author.id))
         var sid = message.guild.id
         xs[sid] =  xs[sid] + ping;
         levels.set(message.author.id, lvs);
         xps.set(message.author.id, xs)
    　　　}
        count.ping_count += 1;
        counts.set(message.author.id, count);
        const trophy = (await trophys.get(message.author.id)) || { ktr: false, dfg: false, cfg: false, kmz: false, kmk: false, yky: false, imo: false, kdn: false, moj: false, swk: false };
        if (count.ping_count >= 100 && trophy.ktr == false ){
          trophy.ktr = true;
          message.reply(`実績解除！【カタツムリ】`);
          trophys.set(message.author.id, trophy);
        }
        console.log(`埋め込み送信完了：200ping => ${count.ping_count}`);
        return;
      } else {
        // ～もしpingが200超えてないのなら
        const ping = 0; // ～リセット
        return;
      }
    }
  }
}); //ping値測定