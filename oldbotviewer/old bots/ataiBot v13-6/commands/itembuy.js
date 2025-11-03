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
        name: "ci-item-buy",
        description: "アイテムを買います。",
    },
	async execute(interaction) {
    const bag = await datas.get("bag", interaction.user.id)
    const tas = await datas.get("day", 'task')
    const items = tas.data.buy
    const itemdsk = items.map(item => {
      const existingItem = itemData.items.find(function(items) {
        return items.itemid === item.itemid;
      });
      if (item.num === 0) return null
      if (existingItem) {
        return {
          itemid: existingItem.itemid,
          name: existingItem.name,
          num: item.num,
          buy: existingItem.buy
        }
      }
    });
    const filteredItems = itemdsk.filter(item => item !== null);
    if (filteredItems.length === 0) return interaction.reply({ content:"こーりん：すまないね、今ある商品はすべて売り切れてしまってね、また今度確認してくれるかな。", ephemeral: true  });
    const selectMenuOptions = filteredItems.map((item) => ({
      label: item.name,
      description: `品数:${item.num}個 値段:${item.buy}円`,
      value: `${item.itemid}`
    }));
    
    const selectMenu = new MessageSelectMenu()
      .setCustomId('itembuy')
      .setPlaceholder('買いたいものを選択')
      .addOptions(selectMenuOptions);

    const actionRow = new MessageActionRow().addComponents(selectMenu);

    let msg = await interaction.reply({ content:"こーりん：いらっしゃい、どの品を買うんだい？", components: [actionRow], ephemeral: true  });
	}
}