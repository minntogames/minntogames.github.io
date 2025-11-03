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
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES",],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

const datas = require("../mongoget.js");
const emojis = require('../ad-emoji.js');

module.exports = { 
  data: {
    type: "SUB_COMMAND",
    name: "react-role-add",
    description: "ロールパネルに新しくロールを追加するよ！！",
    options: [
      { 
        type: "ROLE",
        name: "role",
        description: "つけるロール",
        required: true,
      },
      { 
        type: "STRING",
        name: "id",
        description: "メッセージID",
        required: true,
      },
      {
        type: "STRING",
        name: "emoji",
        description: "つける絵文字(デフォルトはABC...)",
        min_length: 1,
        max_length: 1000,
        required: false,
      },
    ],
  },
	async execute(interaction) {
    if (!interaction.guildId) return interaction.reply({ content: "ギルド専用コマンドだよー", ephemeral: true });
    if (!interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: "管理者専用コマンドだよー", ephemeral: true });
    let role = interaction.options.getRole("role").id
    let id = interaction.options.getString("id")
    let guildId = interaction.guild.id
    const re = await datas.get("role", id)

    const targetMessage = await interaction.channel.messages.fetch(id);
    
    const reactions = targetMessage.reactions.cache;
    
    const emojisArray = reactions.map(reaction => ({
            name: reaction.emoji.name,
            id: reaction.emoji.id
          }));
    
    let finds = Object.keys(emojis)
    .filter(key => !emojisArray.some(item => item.name.toUpperCase() === key))
    .reduce((obj, key) => {
        obj[key] = emojis[key];
        return obj;
    }, {});
    
    const firstItem = Object.entries(finds)[0];
    
    console.log(firstItem)
    
    let emoji = interaction.options.getString("emoji") || "🇦"

return

    if (emoji.startsWith('<') && emoji.endsWith('>')) {
      // `<>`で括られた文字列である場合
      const emojiID = emoji.match(/<:(\w+):(\d+)>/);
      if (emojiID) {
        emoji = emojiID[2]; // 絵文字のID
        console.log(`Custom emoji ID: ${emojiID}`);
      targetMessage.react(emoji).then(() => {interaction.reply({ content: "送信成功！", ephemeral: true })
                                   setRoles(emoji, role, targetMessage.id)})
        .catch(error => {
        interaction.reply({ content: "絵文字が見つからないよー", ephemeral: true });
      })
      }
    } else {
      targetMessage.react(emoji)
        .then(() => {interaction.reply({ content: "送信成功！", ephemeral: true })
                     setRoles(emoji, role, targetMessage.id)})
        .catch(() => {
        interaction.reply({ content: "絵文字が見つからないよー", ephemeral: true });
    })
    }
	}
}

async function setRoles(emojiId, roleId, messageId) {
 const role = await datas.get("role", messageId)
 role.data.reactions.push({
   id: emojiId,
   roleID: roleId
 })
 await datas.save(role, messageId)
}