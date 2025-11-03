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
const cirno = require("../chara.json")
const datas = require("../mongoget.js");

module.exports = {
	data: {
        name: "ci-level-up-notice",
        description: "レベルアップの通知設定です",
        options: [{
            type: "STRING",
            name: "on-off",
            description: "ONかOFFを設定します",
            required: true,
            choices: [
                { name: "ON", value: "true" },
                { name: "OFF", value: "false" },
            ]
        }],
    },
	async execute(interaction) {
    const user = await datas.get("user", interaction.user.id)
    if (interaction.options.getString('on-off') === "true") {
			user.data.setting.Lvnotice = "true";
      await datas.save(user, interaction.user.id);
      await interaction.reply({ content:'レベルアップ通知をONにしたよ！', ephemeral: true });
      return;
    } else {
      user.data.setting.Lvnotice = "false";
      await datas.save(user, interaction.user.id);
      await interaction.reply({ content:'レベルアップ通知をOFFにしたよ！', ephemeral: true });
      return;
    }
	}
}