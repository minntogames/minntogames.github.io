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
    type: "SUB_COMMAND",
    name: "react-role-create",
    description: "ロールパネルを作るよ！",
    options: [
      { 
        type: "ROLE",
        name: "role",
        description: "最初につけるロールだよ！",
        required: true,
      },
      {
        type: "STRING",
        name: "title",
        description: "パネルのタイトルだよ！(デフォルトは\"ちるのパネル\")",
        min_length: 1,
        max_length: 1000,
        required: false
      },
      {
        type: "STRING",
        name: "color",
        description: "パネルカラーだよ！(デフォルトは水色)",
        min_length: 1,
        max_length: 1000,
        required: false,
      },
      {
        type: "STRING",
        name: "emoji",
        description: "絵文字の絵文字！(デフォルトはABC...)",
        min_length: 1,
        max_length: 1000,
        required: false,
      },
    ],
  },
	async execute(interaction) {
    if (!interaction.guildId) return interaction.reply({ content: "ギルド専用コマンドだよー", ephemeral: true });
    // if (!interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: "管理者専用コマンドだよー", ephemeral: true });
    let title = interaction.options.getString("title") || "ちるのパネル"
    let color = interaction.options.getString("color") || "#66fffc"
    let emoji = interaction.options.getString("emoji") || "🇦"
    let role = interaction.options.getRole("role").id
    let guildId = interaction.guild.id
    
    const embed = new MessageEmbed()
    .setTitle(title)
    .setDescription(`${emoji}:<@&${role}>`)
    .setColor("#71C3FF")
    .setFooter("ちるのパネル")
    
    let msg = await interaction.channel.send({ embeds: [embed] })

    if (emoji.startsWith('<') && emoji.endsWith('>')) {
      // `<>`で括られた文字列である場合
      const emojiID = emoji.match(/<:(\w+):(\d+)>/);
      if (emojiID) {
        emoji = emojiID[2]; // 絵文字のID
        console.log(`Custom emoji ID: ${emojiID}`);
      msg.react(emoji).then(() => {interaction.reply({ content: "送信成功！", ephemeral: true })
                                   console.log(msg)
                                   setRoles(emoji, role, msg.id, msg.channel.id)})
        .catch(error => {
        msg.delete;
        interaction.reply({ content: "絵文字が見つからないよー", ephemeral: true });
      })
      }
    } else {
      msg.react(emoji)
        .then(() => {interaction.reply({ content: "送信成功！", ephemeral: true })
                     console.log(msg.reactions.cache)
                     setRoles(emoji, role, msg.id, msg.channel.id)})
        .catch(() => {
        msg.delete;
        interaction.reply({ content: "絵文字が見つからないよー", ephemeral: true });
    })
    }
	}
}

async function setRoles(emojiId, roleId, messageId, channelId) {
 const role = await datas.get("role", messageId)
 role.data.reactions.push({
   id: emojiId,
   channelId,
   messageId,
   roleID: roleId
 })
 await datas.save(role, messageId)
}