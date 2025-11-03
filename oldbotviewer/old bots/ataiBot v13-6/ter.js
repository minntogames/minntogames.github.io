const {
  Client,
  Intents,
  Collection,
  MessageEmbed,
  MessageAttachment,
  MessageActionRow,
  MessageButton,
  GatewayIntentBits,
  AttachmentBuilder,
  ThreadManager,
  Events,
  Guilds,
  Discord,
  WebhookClient
} = require("discord.js");
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_PRESENCES",
  ]
});

let currentStatusIndex = 0;

client.on('ready', () => {
  console.log("ok")
});

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.on('line', (input) => {
  if (input === 'ment') {
    console.log('メッセージが送信されました。')

  } 

});

client.login(process.env.TOKEN);