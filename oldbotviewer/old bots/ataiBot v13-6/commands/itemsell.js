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
        name: "ci-item-sell",
        description: "アイテムを売ります。",
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
        if (num === 0) {
          return null;
        }  
        
        if (id === 10000000) {
          return null;
        } 
        
        if (!sell) {
          return null;
        }    

        const formattedType = Array.isArray(type) ? type.join(', ') : type;
        
        return {
          label: name,
          description: `所持数：${bagItem.item.num}、売却額:${sell}円`,
          value: `${id}`
        }
      }
      
      return null;
    });
    const filteredItems = itemsInBag.filter(item => item !== null);
    const selectMenuOptions = filteredItems.map((item) => ({
      label: item.label,
      description: item.description,
      value: item.value
    }));
    
    console.log(selectMenuOptions) 
    
    const selectMenu = new MessageSelectMenu()
      .setCustomId('itemsell')
      .setPlaceholder('売りたいものを選択')
      .addOptions(selectMenuOptions);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

    let msg = await interaction.reply({ content:"売りたいものを選んでね！", components: [actionRow], ephemeral: true  });
	}
}