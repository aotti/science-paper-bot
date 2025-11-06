import { Client, IntentsBitField } from "discord.js";
import { config } from "dotenv";
import { resolve } from "path";
import { Paper } from "./classes/Paper.js";
import { CronJob, CronJobParams } from "cron";

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
    const paper = new Paper
    const jobErrorHandler = (error: any) => {
        console.log('crob job failed:', error)
    }
    // seconds, minutes, hours, days, months, years
    //    0        0       0      *     *       *
    const job = new CronJob('0 0 9 * * *', () => {
        paper.scrap(b)
    // onComplete, onStart, timeZone
    }, null, true, 'UTC+7',
    // context, runOnInit, utcOffset, unrefTimeout, waitForCompletion, errorHandler
    null, null, null, null, null, jobErrorHandler)
    
})

bot.login(process.env['BOT_TOKEN'])