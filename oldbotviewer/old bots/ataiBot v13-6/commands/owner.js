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

const Keyv = require('keyv');
const bags = new Keyv("mongodb+srv://cirno:14532821da@atai.zoooafw.mongodb.net/?retryWrites=true&w=majority", { collection: "BAG" })

module.exports = { 
	data: {
    type: "SUB_COMMAND",
    name: "ci-owner-certification",
    description: "氷結チルノ専用コマンド。古参メンバーの認定",
    options: [{
      type: "USER",
      name: "target",
      description: "認定するユーザー",
      }],
    },
	async execute(interaction) {
    return interaction.reply({ content:'現在item情報改変により閉鎖中', ephemeral: true });
    if (interaction.user.id !== "830570869742764062") return interaction.reply({ content:'氷結チルノ専用コマンドです。', ephemeral: true });
    const user = interaction.options.getUser('target');
    if (!user) {
       await interaction.reply({ content:'認定するユーザーを指定してください。', ephemeral: true });
    } else {
      const bag = (await bags.get(user.id))|| { items: [] };
      var existingItem = bag.items.find(function(item) {
       return item.item.name === "古参の印" || item.item.itemid === 9999;
      });
      if (existingItem) {
        return interaction.reply({ content:`${user.username}は既に所持しています。`, ephemeral: true });
      } else {
        var newItem = {
        itemid: 9999,
        name: "古参の印",
        rarity: 15,
        num: 1,
        description: "氷天万象に古くから存在したものに与えられる不思議なアイテム。"
      };
      bag.items.push({ item: newItem });
      await bags.set(user.id, bag);
      await interaction.reply({ content:`${user.username}は認証されました。`, ephemeral: true });
      }
    }
	}
}