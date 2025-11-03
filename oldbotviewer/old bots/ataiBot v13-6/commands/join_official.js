const {
  Client,
  Intents,
  MessageEmbed,
  MessageSelectMenu,
  MessageActionRow,
  MessageButton,
  GatewayIntentBits,
  AttachmentBuilder,
  Events,
  Discord,
} = require("discord.js");
const itemData = require("../items.json")
const datas = require("../mongoget.js");

module.exports = {
	data: {
        name: "ci-join-bot-official-server",
        description: "公式サーバーに入ります",
    },
	async execute(interaction) {
    interaction.reply({ content:"[参加してくれるの？ありがとう！](https://discord.gg/NZavVpWfD3)", ephemeral: true  });
	}
}