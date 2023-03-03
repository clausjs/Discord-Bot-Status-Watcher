import {
    CommandInteraction, GuildMember
} from 'discord.js';
import { Database, getDatabaseInstance } from '../database';
import { Watchers } from '../Watchers';
const db: Database = getDatabaseInstance();

export const unwatchbot = async (interaction: CommandInteraction, watchers: Watchers) => {
    await interaction.deferReply({ ephemeral: true });
    
    let bot: GuildMember;
    if (interaction.isChatInputCommand()) {
        bot = interaction.options.getMentionable('bot') as GuildMember;
        if (!bot) {
            await interaction.editReply("Bot not found");
            return;
        }
    } else return;


    try {
        const removed: boolean = await db.removeBot(bot?.user.id);
        if (removed) {
            await interaction.editReply(`No longer watching ${bot?.user?.username}`);
            return
        } else {
            await interaction.editReply(`Nothing to delete. Bot not found`);
        }
        await watchers.removeBot({ name: bot?.user?.username, bot_id: bot?.user.id });
    } catch (err) {
        console.error(err);
    }
}