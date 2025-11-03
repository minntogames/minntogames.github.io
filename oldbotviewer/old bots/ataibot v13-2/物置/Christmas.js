const {
  Client,
  Intents,
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton, 
  ButtonStyle,
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
const cron = require("node-cron");
const Keyv = require("keyv");
const Tasks = new Keyv("sqlite://sqlite/C.sqlite", { table: "Tasks" });
const Boxs = new Keyv("sqlite://sqlite/C.sqlite", { table: "Boxs" });
const days = new Keyv("sqlite://sqlite/C.sqlite", { table: "days" });

const { listTimeZones } = require("timezone-support");
const { parseFromTimeZone, formatToTimeZone } = require("date-fns-timezone");
const FORMAT = "HH";
const TIME_ZONE_TOKYO = "Asia/Tokyo";
const now = new Date();

exports.Cri = function () {
  cron.schedule("15 0 15,23,6,12 * * *", () => {
//       const day = (days.get(client.users.cache.get)) || { day: 0 };
//       days.clear(day);
    
//       const touhyo = new MessageEmbed()
//               .setTitle("とうひょうのじかんだよー\n（一人３回投票できるよ！）\n（とうひょうのしなおしはできないよ～）")
//               .setColor("#71C3FF")
      
//       const buttons = [
//         new MessageButton() .setCustomId("blb") .setStyle("PRIMARY") .setLabel("青色の箱"),
//         new MessageButton() .setCustomId("grb") .setStyle("SUCCESS") .setLabel("緑色の箱"),
//         new MessageButton() .setCustomId("reb") .setStyle("DANGER") .setLabel("赤色の箱")
//       ]

//       client.channels.cache
//         .get("868710319881588797")
//         .send({ embeds: [touhyo], components: [new MessageActionRow().addComponents(buttons)]});
    }); //0時、8時、15時、21時
  
  client.on("messageCreate", async (message) => {
    
    if (message.content === "ci!pre") {
      if (message.author.id !== "811186190707195906")return
      const touhyo = new MessageEmbed()
            .setTitle("とうひょうのじかんだよー\n（一人３回投票できるよ！）\n（とうひょうのしなおしはできないよ～）")
            .setColor("#71C3FF")
      
      const buttons = [
        new MessageButton() .setCustomId("blb") .setStyle("PRIMARY") .setLabel("青色の箱"),
        new MessageButton() .setCustomId("grb") .setStyle("SUCCESS") .setLabel("緑色の箱"),
        new MessageButton() .setCustomId("reb") .setStyle("DANGER") .setLabel("赤色の箱")
      ]
      
      await message.channel.send({ embeds: [touhyo], components: [new MessageActionRow().addComponents(buttons)]});
    } //投票召喚
    if (message.content === "ci!rep") {
      if (message.author.id !== "811186190707195906")return
      const day = (await days.get(client.users.cache.get)) || { day: 0 };
      days.clear(day);
    } //投票券リセット
    if (message.content === "ci!投票リセット") {
      if (message.author.id !== "811186190707195906")return
      const hyo = (await Boxs.get('box')) || { blue:0, green:0, red:0 }
      console.log(`${hyo.blue}, ${hyo.green}, ${hyo.red}`);
    } //もしものことがあったばぁい用
    if (message.content === "ci!goukei") {
      if (message.author.id !== "811186190707195906")return
      const hyo = (await Boxs.get('box')) || { blue:0, green:0, red:0 }
      console.log(`${hyo.blue}, ${hyo.green}, ${hyo.red}`);
    } //ログに表合計
    if (message.content === "ci!gift") {
      if (message.author.id !== "811186190707195906")return
      const meri = new MessageEmbed()
        .setTitle("めりーくりすまーす！")
        .setColor("#71C3FF")
      const buttons = [
        new MessageButton() .setCustomId("gift") .setStyle("PRIMARY") .setLabel("青色の箱を受け取る"),
      ]
　　   await message.channel.send({ embeds: [meri], components: [new MessageActionRow().addComponents(buttons)]});
    } 
  });
  
  client.on('interactionCreate', async (interaction) => {
    
     if (interaction.customId === "gift") {
       const item = new Keyv("sqlite://sqlite/db.sqlite", { table: "items" });
       const items = (await item.get(interaction.user.id)) || { osai_sen: 0, waku_change: 0 };
       const day = (await days.get(interaction.user.id)) || { day: 0, pre: 0 };
       
       if (day.pre >= 1) return await interaction.reply({ content: "もう受け取ったよ～", ephemeral: true });
       
       day.pre += 1;
       items.osai_sen -= 0;
       items.osai_sen += 5000;
       items.waku_change = 0;
       items.waku_change -= 0;
       items.waku_change += 10;
       
       days.set(interaction.user.id, day);
       item.set(interaction.user.id, items);
       await interaction.reply({ content: `5000円と枠無料変更券10枚ゲット！`, ephemeral: true });
       console.log(`${items.osai_sen}円, ${items.waku_change}個,ok${day.pre}`);
     }
    
     if (interaction.customId === "blb") {
       await interaction.reply({ content: `投票期間は終了したよ～”ci!gift”でプレゼントを受け取ろう！`, ephemeral: true });
       // const hyo = (await Boxs.get('box')) || { blue:0, green:0, red:0 }
       // const day = (await days.get(interaction.user.id)) || { day: 0 };
       // if (day.day >= 3) return await interaction.reply({ content: "投票回数全部使ったよ！", ephemeral: true });
       // hyo.blue += 1;
       // day.day += 1;
       // await interaction.reply({ content: `青色の箱に投票したよ！(残り回数${3 - day.day}回)`, ephemeral: true });
       // days.set(interaction.user.id, day);
       // Boxs.set('box', hyo);
     }
    
     if (interaction.customId === "grb") {
       await interaction.reply({ content: `投票期間は終了したよ～”ci!gift”でプレゼントを受け取ろう！`, ephemeral: true });
       // const hyo = (await Boxs.get('box')) || { blue:0, green:0, red:0 }
       // const day = (await days.get(interaction.user.id)) || { day: 0 };
       // if (day.day >= 3) return await interaction.reply({ content: "投票回数全部使ったよ！", ephemeral: true });
       // hyo.green += 1;
       // day.day += 1;
       // await interaction.reply({ content: `緑色の箱に投票したよ！(残り回数${3 - day.day}回)`, ephemeral: true });
       // days.set(interaction.user.id, day);
       // Boxs.set('box', hyo);
     }
    
     if (interaction.customId === "reb") {
       await interaction.reply({ content: `投票期間は終了したよ～”ci!gift”でプレゼントを受け取ろう！`, ephemeral: true });
       // const hyo = (await Boxs.get('box')) || { blue:0, green:0, red:0 }
       // const day = (await days.get(interaction.user.id)) || { day: 0 };
       // if (day.day >= 3) return await interaction.reply({ content: "投票回数全部使ったよ！", ephemeral: true });
       // hyo.red += 1;
       // day.day += 1;
       // await interaction.reply({ content: `赤色の箱に投票したよ！(残り回数${3 - day.day}回)`, ephemeral: true });
       // days.set(interaction.user.id, day);
       // Boxs.set('box', hyo);
     }
    
	});
}
