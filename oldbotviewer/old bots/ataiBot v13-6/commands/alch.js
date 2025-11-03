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

module.exports = {
	data: {
        name: "ci-alch",
        description: "錬金術をします。",
    },
	async execute(interaction) {
    // if (interaction.user.id !== "811186190707195906") return
    const filterItemsWithAlch = (items) => {
      return items.filter(item => item.alch);
    };

    const itemsWithAlch = filterItemsWithAlch(itemData.items);

    const selectMenuOptions = itemsWithAlch.map((item) => ({
      label: item.name,
      description: `レア度：${item.rarity}`,
      value: `${item.itemid}`
    }));
    
    const selectMenu = new MessageSelectMenu()
      .setCustomId('itemalch')
      .setPlaceholder('合成したいものを選択')
      .addOptions(selectMenuOptions);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

    let msg = await interaction.reply({ content:"合成したいものを選択してください。", components: [actionRow], ephemeral: true });
	}
}