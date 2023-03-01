import { EventEmitter } from 'events';
import { MongoClient, Db, Collection, WithId, OptionalId, ModifyResult } from 'mongodb'
import { Bot, BotOptions, Channel } from '../types';

// Connection URL
if (!process.env.MONGO_USER || !process.env.MONGO_PASSWORD || !process.env.MONGO_CLUSTER || !process.env.MONGO_DB) throw new Error("Cannot connect to database. Missing environment variables.");
const url = `mongodb+srv://${process.env.MONGO_USER}:${encodeURIComponent(process.env.MONGO_PASSWORD)}@${process.env.MONGO_CLUSTER}.js4zbyt.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url);

// Database Name
const dbName = `${process.env.MONGO_DB}`;

export class Database extends EventEmitter {
    private static instance: Database;
    private db: Db | null;
    //@ts-ignore
    private botCollection: Collection<Bot>;
    //@ts-ignore
    private channelCollection: Collection<Channel>;
    public bots: WithId<Bot>[] = [];
    public channels: WithId<Channel>[] = [];

    constructor() {
        super();

        if (!process.env.MONGO_BOT_COLLECTION || !process.env.MONGO_CHANNELS_COLLECTION) throw new Error("Cannot connect to database. Missing collection names: MONGO_BOT_COLLECTION OR MONGO_CHANNELS_COLLECTION.");

        this.db = null;

        client.connect().then(async () => {
            console.log('Connected successfully to server');
            this.db = client.db(dbName);
            this.botCollection = this.db.collection(process.env.MONGO_BOT_COLLECTION || "");
            this.channelCollection = this.db.collection(process.env.MONGO_CHANNELS_COLLECTION || "");
            this.bots = await this.getAllBots();
            this.channels = await this.getAllChannels();
            this.emit('ready');
        }).catch(err => {
            console.error(err);
        });
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public getAllBots = async (): Promise<WithId<Bot>[]> => {
         return await this.botCollection.find({}).toArray();
    }

    public getAllChannels = async (): Promise<WithId<Channel>[]> => {
        return await this.channelCollection.find({}).toArray();
    }

    public getBotById = async (id: string): Promise<Bot | undefined> => {
        const bot = await this.botCollection.findOne({ bot_id: id });
        if (bot) return bot;
    }

    public getChannelById = async (id: string): Promise<WithId<Channel> | undefined> => {
        const channel = await this.channelCollection.findOne({ channel_id: id });
        if (channel) return channel;
    }

    public getChannelByGuildId = async (id: string): Promise<WithId<Channel> | undefined> => {
        const channel = await this.channelCollection.findOne({ guild: id });
        if (channel) return channel;
    }

    public getChannelsForManyGuildsById = async (ids: string[]): Promise<WithId<Channel>[] | undefined> => {
        const channels = await this.channelCollection.find({ guild: { $in: ids } }).toArray();
        if (channels) return channels;
    }

    public insertNewBot = async (name: string, id: string, options?: BotOptions): Promise<void> => {
        const insertOptions: OptionalId<Bot> = { name, bot_id: id };
        if (options) insertOptions.options = options;
        else insertOptions.options = { timeToReport: 5 };
        await this.botCollection.insertOne(insertOptions);
        this.bots = await this.getAllBots();
    }

    public addChannel = async (id: string, guild: string): Promise<boolean> => {
        const res: ModifyResult<Channel> = await this.channelCollection.findOneAndUpdate({ guild }, { $set: { channel_id: id }, $setOnInsert: { disableAlerts: false } }, { upsert: true });
        if (res.ok === 1) {
            this.channels = await this.getAllChannels();
        } else throw new Error(res.lastErrorObject?.err);

        return res.lastErrorObject?.updatedExisting as boolean;
    }

    public removeBot = async (id: string): Promise<void> => {
        await this.botCollection.deleteOne({ bot_id: id });
        this.bots = await this.getAllBots();
    }

    public close(): void {
        client.close();
    }
}

let instance: Database | undefined;
export const getDatabaseInstance = () => {
    if (!instance) instance = new Database();
    return instance;
}

