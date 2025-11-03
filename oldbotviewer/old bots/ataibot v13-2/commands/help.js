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
        name: "help",
        description: "コマンド一覧を呼び出すよ！",
    },
	async execute(interaction) {
		const help = new MessageEmbed()
      .setTitle("へるぷ一覧！")
      .addFields({ name: 'ci!ping', value: '> pingを返すよ！' },
                 { name: 'ci!dayn', value: '> 今日pingしたか確認で確認できるよ！' },
                 { name: 'ci!shu', value: '> URLを短縮するよ！' },
                 { name: 'ci!time', value: '> 現在時刻（日本時間）を返すよ！' },
                 { name: 'ci!ava', value: '> あなたのアイコンを返すよ！' },
                 { name: 'ci!ram', value: '> ”あたい最強”を並び替えて返すよ！' },
                 { name: 'ci!emoji', value: '> 絵文字を返すよ！' },
                 { name: 'ci!omi', value: '> おみくじができるよ！' },
                 { name: 'ci!lvs', value: '> レベルを確認できるよ！(レベル表はこちらhttps://bit.ly/3iB3Di1)' },
                 { name: 'ci!icoc', value: '> アイコンの色の枠を変更できるよ！（16進数カラーコード専）(25円必要)' },
                 { name: 'ci!okz', value: '> 巫女さんからおこずかいをもらえるよ！' },
                 { name: 'ci!trophy', value: '> 今持っている実績を確認するよ！' },
                 { name: 'ci!ranking', value: '> ランキングがみれるよ！ <lv|wallet>' },
                 { name: 'ci!obr', value: '> オカルトボールが錬成できるよ！' },
                 { name: 'ci!bag', value: '> 持ち物が確認できるよ！' },)
      .setColor("#71C3FF")
      .setTimestamp();
    await interaction.reply({ embeds: [help], ephemeral: true }); //隠すとき　ephemeral: true
	}
}