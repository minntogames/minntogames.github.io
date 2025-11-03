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
const url = require('url');

module.exports = {
  data: {
    name: "ci-urlconversion",
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
      if (!interaction.options.getString("url").match("https://") || !interaction.options.getString("url").startsWith('https://')){
        return interaction.reply({ content: "`https://`から始まるURLを入力してください。", ephemeral: true, });
      }
      function shortenOrExpand(urlToProcess, callback, he) {
        isgd.lookup(urlToProcess, (lookupUrl) => {
          if (lookupUrl && url.parse(lookupUrl).hostname === 'is.gd') {
            isgd.expand(urlToProcess, (expandedUrl) => {
            callback({ URL: expandedUrl, he: "復元"});
          });
          } else {
            isgd.shorten(urlToProcess, (shortenedUrl) => {
            callback({ URL: shortenedUrl, he: "圧縮"});
          });
          }
          // return { URL:}
      });
      }
      
      shortenOrExpand(interaction.options.getString("url"), (resultUrl) => {
        if (resultUrl.URL.startsWith('Error:')) {
          console.log(resultUrl);
          let e = resultUrl.URL
          console.log(e);
          if (e.includes('blacklist')) {
            return interaction.reply({ content: "変換失敗！指定されたURLはブラックリストに入っています！", ephemeral: true, });
          } else {
            return interaction.reply({ content: "変換失敗！不明なエラー。以下エラー文\n" + resultUrl, ephemeral: true, });
          }
        } else {
          console.log('Processed URL:', resultUrl);
          if (interaction.options.getString("ephemeral") === "true" || !interaction.options.getString("ephemeral")){
            interaction.reply({ content: resultUrl.he + "せいこう！\n> " + resultUrl.URL, ephemeral: true, });
          } else if (interaction.options.getString("ephemeral") === "false") {
            interaction.reply({ content: resultUrl.he + "せいこう！\n> " + resultUrl.URL, ephemeral: false, });
          }
        }
      });

    }
  },
};
