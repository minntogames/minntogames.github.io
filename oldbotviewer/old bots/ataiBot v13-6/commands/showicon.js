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

module.exports = {
	data: {
    type: "SUB_COMMAND",
    name: "ci-usericon",
    description: "ユーザーのアイコンを取得します。",
    options: [{
      type: "USER",
      name: "target",
      description: "表示するユーザー",
      }],
    },
  async execute(interaction) {
    if (interaction.options.getUser('target')){
      const user = interaction.options.getUser('target');
      const embed = new MessageEmbed()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL())
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    } else { 
      const user = interaction.user;
      console.log(user);
      const embed = new MessageEmbed()
        .setTitle(`${user.username}'s Avatar`)
        .setImage(user.displayAvatarURL())
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }
  },
};
