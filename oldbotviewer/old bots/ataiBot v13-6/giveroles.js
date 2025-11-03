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
  Partials,
  Events,
  Guilds,
  Discord,
} = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_PRESENCES",],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});
const { setTimeout } = require('node:timers/promises');
const datas = require("./mongoget.js");

exports.role = function () {
  client.on('messageReactionAdd', async (reaction, user) => {
    if(user.bot) return
    const role = await datas.get("role", reaction.message.id)
    try {
      const messageID = reaction.message.id;
      let roles = role.data
      const emojis = roles.reactions.find(r => r.id === reaction.emoji.id || reaction.emoji.name)
      
      if (!emojis) return
      
      let emozi = reaction.emoji.id || reaction.emoji.name
      
      if (emojis.id !== emozi) return
      console.log("起動")

      if (reaction.partial || emojis.roleID) {
        // リアクション情報を保存
        await reaction.users.remove(user.id);
        let con = `<@&${emojis.roleID}>を付与したよ！`
        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user);
        
        try {
          if (member.roles.cache.has(emojis.roleID)){
            con = `<@&${emojis.roleID}>を解除したよ！`
            member.roles.remove(emojis.roleID)
            console.log("ロール解除成功")
          } else {
            member.roles.add(emojis.roleID)
            console.log("ロール付与成功")
          }
        } catch(err) {
          console.log("ロール付与失敗：", err)
        }

        const embed = new MessageEmbed()
        .setDescription(con)
        // let msgs = await reaction.message.reply({ content :`${user}`, embeds: [embed] })
        await setTimeout(5000);

        // return await msgs.delete();
        return;
      }
    } catch(err) {
      console.log("missGiveparm", err)
    }
  });
};

client.login(process.env.TOKEN);