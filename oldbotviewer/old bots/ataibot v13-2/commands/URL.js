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
var isgd = require("isgd");

module.exports = {
  data: {
    name: "urlshort",
    description: "URLを短くするよ！",
    options: [
      {
        type: "STRING",
        name: "url",
        description: "ここにURL",
        min_length: 1,
        max_length: 1000,
        required: true,
      },
      {
        type: "STRING",
        name: "ephemeral",
        description: "メッセージ表示するか隠すかの設定だよ！(trueで隠す)",
        required: false,
        choices: [
          { name: "true", value: "true" },
          { name: "false", value: "false" },
        ],
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.options.getString("url")) {
      await interaction.reply({ content: "URLが入力されてないよ！", ephemeral: true, });
    } else {
      const aarsd = interaction.options.getString("url");
      if (interaction.options.getString("ephemeral") === "true" || !interaction.options.getString("ephemeral")){
        isgd.shorten(aarsd, function (res) {
        interaction.reply({ content: "短縮せいこう！\n> " + res, ephemeral: true, });
        });
      } else if (interaction.options.getString("ephemeral") === "false") {
        isgd.shorten(aarsd, function (res) {
        interaction.reply({ content: "短縮せいこう！\n> " + res, ephemeral: false, });
        });
      }
    }
  },
};
