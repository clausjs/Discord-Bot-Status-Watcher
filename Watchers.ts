import { Client, GuildMember, MessageFlags, Presence, TextChannel, User } from "discord.js";
import { WithId } from "mongodb";
import { Bot, Channel } from "./types";
import { Database, getDatabaseInstance } from "./database";
import * as moment from 'moment';
import 'moment-timezone';
const db: Database = getDatabaseInstance();

export class Watchers {
    private client: Client;
    private channels: Channel[];
    private bots: Bot[];
    private timers: { [id: string]: NodeJS.Timeout | undefined };

    constructor(client: Client, bots: WithId<Bot>[], channels: WithId<Channel>[]) {
        this.timers = {};
        this.client = client;
        this.bots = bots;
        this.channels = channels;
        this.initializeTimers();
    }

    private sendMessage = async (channel: TextChannel, message: string, silent?: boolean) => {
        channel.send(message);
    }

    private addTimer = (bot: User, interval: number) => {
        if (!this.timers[bot.username]) {
            this.timers[bot.username] = setInterval(async () => {
                for (let i = 0; i < this.channels.length; i++) {
                    const channelInfo = this.channels[i];
                    const discordChannel: TextChannel | undefined = await this.client.channels.cache.get(channelInfo.channel_id) as TextChannel;
                    const lastSeen: Date | undefined = await db.getBotLastSeen(bot.id);
                    if (discordChannel) {
                        if (lastSeen) {
                            const timezone: string | undefined = process.env.TIMEZONE_CODE;
                            discordChannel.send(`${bot.username} has been offline for ${interval} minutes or more. Last seen: ${timezone ? moment(lastSeen).tz(timezone).fromNow() : moment(lastSeen).fromNow() }`);
                        } else {
                            discordChannel.send(`${bot.username} has been offline for ${interval} minutes or more.`);
                        }
                    }
                }
            }, interval * (60 * 1000));
        }
    }

    private initializeTimers = async () => {
        for (let i = 0; i < this.bots.length; i++) {
            const botInfo = this.bots[i];
            const interval: number = botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5;
            const bot: User | undefined = await this.client.users.fetch(botInfo.bot_id);
            const discordChannel: TextChannel | undefined = await this.client.channels.fetch(this.channels[0].channel_id) as TextChannel;
            if (bot && discordChannel) {
                const member: GuildMember | undefined = await discordChannel.guild.members.fetch(bot.id);
                if (!member?.presence) {
                    for (let i = 0; i < this.channels.length; i++) {
                        const channel: TextChannel | undefined = this.client.channels.cache.get(this.channels[i].channel_id) as TextChannel;
                        if (channel) {
                            channel.send(`${bot.username}'s presence cannot be determined at Watcher startup. Setting up alert for ${interval} minutes.`);
                        }
                    }
                    this.addTimer(bot, interval);
                } else this.timers[bot.username] = undefined;
            }
        }
    }

    private stopTimer = (botInfo: Bot) => {
        if (this.timers[botInfo.name]) {
            clearInterval(this.timers[botInfo.name]);
            delete this.timers[botInfo.name];
        }
    }

    public addBot = async (botInfo: Bot) => {
        const bot: User | undefined = await this.client.users.fetch(botInfo.bot_id);
        if (bot) this.timers[bot.username] = undefined;
        const botGuildMember: GuildMember | undefined = await this.client.guilds.cache.get(this.channels[0].guild)?.members.fetch(botInfo.bot_id);
        if (!botGuildMember) throw new Error("Could not find bot in a guild to determine presence. Bot's status is unknown until a change is detected.");
        if (!botGuildMember.presence) {
            for (let i = 0; i < this.channels.length; i++) {
                const channel: TextChannel | undefined = this.client.channels.cache.get(this.channels[i].channel_id) as TextChannel;
                if (channel) {
                    channel.send(`${bot.username}'s presence cannot be determined when watch was initiated. Setting up alert for ${botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5} minutes.`);
                }
            }
            this.addTimer(bot, botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5);
        }
    }

    public removeBot = (botInfo: Bot) => {
        this.stopTimer(botInfo);
    }

    public presenceChanged = async (presence: Presence) => {
        const botInfo: Bot | undefined = this.bots.find(bot => bot.bot_id === presence.user?.id);
        if (presence.user && botInfo) {
            if (presence.status === "offline") {
                const bot: User | undefined = this.client.users.cache.get(presence.user.id);
                if (bot) this.addTimer(bot, botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5);
                await db.updateBotLastSeen(presence.user.id);
            } else if (presence.status === "online") {
                this.stopTimer(botInfo);
                await db.clearBotLastSeen(presence.user.id);
            }
        }
    }
}

let instance: Watchers | undefined;
const getInstance = (client: Client, bots: WithId<Bot>[], channels: WithId<Channel>[]) => {
    if (!instance) {
        instance = new Watchers(client, bots, channels);
    }
    return instance;
}
export default getInstance;