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
        name: "ci-item-use",
        description: "アイテムを使用します",
    },
	async execute(interaction) {
    const bag = await datas.get("bag", interaction.user.id)
    const itemsInBag = bag.data.items.map(bagItem => {
      const itemId = bagItem.item.itemid;
      const itemDetail = itemData.items.find(item => item.itemid === itemId);
      if (itemDetail) {
        const { name, description, rarity, type, sell } = itemDetail;
        const num = bagItem.item.num;
        const id = bagItem.item.itemid;
        
        if (num === 0) return null;
        
        if (id === 10000000) return null;
        
        let array = ["food", "buff", "use"]
        
        const found = array.some(item => Array.isArray(type) ? type.includes(item) : item === type);
        
        const notFound = !found
        
        if(notFound) return null;
        
        return {
          label: name,
          description: `所持数：${bagItem.item.num}`,
          value: `${id}`
        }
      }
      
      return null;
    });
    const filteredItems = itemsInBag.filter(item => item !== null);
    if (filteredItems.length <= 0) return interaction.reply({ content:"使えるアイテムがないよ！", ephemeral: true  });
    
    const selectMenuOptions = filteredItems.map((item) => ({
      label: item.label,
      description: item.description,
      value: item.value
    }));
    
    const selectMenu = new MessageSelectMenu()
      .setCustomId('itemuse')
      .setPlaceholder('使いたいものを選択')
      .addOptions(selectMenuOptions);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

    let msg = await interaction.reply({ content:"つかいたいものを選んでね！", components: [actionRow], ephemeral: true  });
	}
}