import { config } from "dotenv";
const dotenv = config();
import { ApplicationCommand, Client, GatewayIntentBits, User } from "discord.js";
import { getDatabaseInstance } from "./database";
import { default as getInstance, Watchers } from "./Watchers";
const fs = require('fs');
const path = require('path');
const commands = require('./commands');
const db = getDatabaseInstance();
let watchers: Watchers | undefined;

if (dotenv.error) {
    console.error("Error getting env vars: ", dotenv.error);
    process.exit();
  } else {
    console.info("Successfully loaded env vars.");
  }

if (!process.env.DISCORD_TOKEN) throw new Error("Cannot start bot. Missing environment variable \"DISCORD_TOKEN\".");
const BotWatcher = new Client({ intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent 
]});

db.on('ready', () => {
    watchers = getInstance(BotWatcher, db.bots, db.channels);
});

process.on('SIGINT', () => {
    console.log("Shutting down...");
    db.close();
    BotWatcher.destroy();
    process.exit();
});

function main() {
    
    BotWatcher.login(process.env.DISCORD_TOKEN).catch(err => {
        console.error("Error logging in: ", err);
        process.exit();
    });

    BotWatcher.once('ready', async () => {
        console.info("Bot is ready.");
        
        const pathToCommandsJson = path.resolve(__dirname, '../commands/commands.json');
        if (fs.existsSync(pathToCommandsJson)) {
            // Add commands for interaction

            const commandDefs = require(pathToCommandsJson);
            const tasks: Promise<void>[] = [];
            commandDefs.map(async (command: any) => {
                tasks.push(new Promise(async (resolve, reject) => {
                    try {
                        const discordCommand: ApplicationCommand | undefined = BotWatcher.application?.commands.cache.find(c => c.name === command.name);
                        if (discordCommand) {
                            await BotWatcher.application?.commands.edit(discordCommand.id, command);
                            console.log("successfully updated command: ", command);
                        } else {
                            await BotWatcher.application?.commands.create(command);
                            console.log("successfully added command: ", command);
                        }
                        resolve();
                    } catch (err) {
                        console.error("Error adding command: ", err);
                        reject(err);
                    }
                }));
            });

            await Promise.all(tasks).catch(err => {
                console.error("Error adding commands: ", err);
            });

            // Remove file after loading commands
            fs.rmSync(pathToCommandsJson, { force: true });
        }
    });

    BotWatcher.on('error', (err) => {
        console.error(err);
    });

    BotWatcher.on('presenceUpdate', async (oldPresence, newPresence) => {
        if (!newPresence) return;
        watchers?.presenceChanged(newPresence); 
    });

    BotWatcher.on('interactionCreate', (interaction) => {
        if (!interaction.isCommand()) return;

        const command = interaction.commandName;
        if (commands[command]) commands[command](interaction, watchers);
    });
}

main();