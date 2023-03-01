export interface Bot {
    name: string;
    bot_id: string;
    options?: BotOptions;
}

export interface BotOptions {
    timeToReport: number;
}

export interface Channel {
    channel_id: string;
    guild: string;
    disableAlerts?: boolean;
}