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
const datas = require("../mongoget.js");

module.exports = {
	data: {
        name: "ci-auto-twitter-url-conversion",
        description: "自動変換機能の設定です。",
        options: [
          {
            type: "STRING",
            name: "on-off",
            description: "有効か無効かを設定します",
            required: true,
            choices: [
                { name: "有効", value: "true" },
                { name: "無効", value: "false" },
            ]
          },
          {
            type: "STRING",
            name: "auto-delete",
            description: "元メッセージを削除するか設定",
            required: true,
            choices: [
                { name: "消す", value: "true" },
                { name: "消さない", value: "false" },
            ]
          },
          {
            type: "STRING",
            name: "auto-fixed",
            description: "自動固定するかの設定",
            required: true,
            choices: [
                { name: "有効", value: "true" },
                { name: "無効", value: "false" },
            ]
          },
          {
            type: "STRING",
            name: "destination",
            description: "変換形式の設定です",
            required: true,
            choices: [
                { name: "FX", value: "fxtwitter.com" },
                { name: "VX", value: "vxtwitter.com" },
            ]
          }
        ],
    },
	async execute(interaction) {
    const user = await datas.get("user", interaction.user.id)
		user.data.setting.twitter.con_x = interaction.options.getString('on-off');
    user.data.setting.twitter.con_x_del = interaction.options.getString('auto-delete');
    user.data.setting.twitter.com_x_fix = interaction.options.getString('auto-fixed');
    user.data.setting.twitter.com_x_des = interaction.options.getString('destination');
    await datas.save(user, interaction.user.id);
    await interaction.reply({ content:'設定を変更したよ！', ephemeral: true });
    return;
	}
}