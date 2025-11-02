import { Client, IntentsBitField } from "discord.js";
import { config } from "dotenv";
import { resolve } from "path";

// set env
const ENV_PATH = resolve(process.cwd(), '.env')
config({ path: ENV_PATH })

// initialize discord bot
const bot = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMembers,
    ]
})

bot.on('clientReady', b => {
    console.log(`${b.user.tag} is online at ${new Date().toLocaleTimeString()}`);
    // set activity
    b.user.setActivity('/paper')
    // run daily function
})

bot.login(process.env['BOT_TOKEN'])