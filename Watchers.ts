import { Client, GuildMember, Presence, TextChannel, User } from "discord.js";
import { WithId } from "mongodb";
import { Bot, Channel } from "./types";

class Watchers {
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

    private addTimer = (bot: User, interval: number) => {
        this.timers[bot.username] = setInterval(async () => {
            for (let i = 0; i < this.channels.length; i++) {
                const channelInfo = this.channels[i];
                const discordChannel: TextChannel | undefined = await this.client.channels.cache.get(channelInfo.channel_id) as TextChannel;
                if (discordChannel) {
                    discordChannel.send(`${channelInfo.disableAlerts ? "@silent" : ""} ${bot.username} has been offline for ${interval} minutes or more.`);
                }
            }
        }, interval * (60 * 1000));
    }

    private initializeTimers = async () => {
        for (let i = 0; i < this.bots.length; i++) {
            const botInfo = this.bots[i];
            const interval: number = botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5;
            const bot: User | undefined = await this.client.users.fetch(botInfo.bot_id);
            const discordChannel: TextChannel | undefined = this.client.channels.cache.get(this.channels[0].channel_id) as TextChannel;
            if (bot && discordChannel) {
                const member: GuildMember | undefined = await discordChannel.guild.members.cache.find(member => member.user.id === bot.id);
                if (member?.presence?.status === "offline") {
                    this.addTimer(bot, interval);
                } else this.timers[bot.username] = undefined;
            }
        }
    }

    public addBot = async (botInfo: Bot) => {
        const bot: User | undefined = await this.client.users.fetch(botInfo.bot_id);
        if (bot) this.timers[bot.username] = undefined;
    }

    public stopTimer = (botInfo: Bot) => {
        if (this.timers[botInfo.name]) {
            clearInterval(this.timers[botInfo.name]);
            delete this.timers[botInfo.name];
        }
    }

    public presenceChanged = (presence: Presence) => {
        const botInfo: Bot | undefined = this.bots.find(bot => bot.bot_id === presence.user?.id);
        if (presence.user && botInfo) {
            if (presence.status === "offline") {
                const bot: User | undefined = this.client.users.cache.get(presence.user.id);
                if (bot) this.addTimer(bot, botInfo.options?.timeToReport ? botInfo.options?.timeToReport : 5);
            } else {
                this.stopTimer(botInfo);
            }
        }
    }
}

export default Watchers;