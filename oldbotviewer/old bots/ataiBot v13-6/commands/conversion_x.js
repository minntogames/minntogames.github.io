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

module.exports = { 
	data: {
    name: "ci-twitterurlconversion",
    description: "TwitterのURLをfxtwitterに変換するよ！",
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
    const urlOption = interaction.options.getString("url")
    if (!urlOption) {
      await interaction.reply({ content:'URLを送信してね！', ephemeral: true });
      return;
    }
    if (!urlOption.startsWith('https://')) {
      await interaction.reply('https://から始まるURLを指定してね！');
      return;
    }

    if (urlOption.includes('twitter.com') || urlOption.includes('x.com')) {
      const convertedUrl = urlOption.replace(/(twitter\.com|x\.com)/g, 'fxtwitter.com');
      if (interaction.options.getString("ephemeral") === "true"){
        await interaction.reply({ content:`${convertedUrl}`, ephemeral: true });
      } else if (interaction.options.getString("ephemeral") === "false" || !interaction.options.getString("ephemeral")){
        await interaction.reply({ content:`${convertedUrl}`, ephemeral: false });
      }
    } else {
      await interaction.reply({ content:'変換に失敗したよ…', ephemeral: true });
    }
	}
}