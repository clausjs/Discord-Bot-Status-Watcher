import {
    CommandInteraction, GuildMember
} from 'discord.js';
import { Database, getDatabaseInstance } from '../database';
const db: Database = getDatabaseInstance();

export const watchbot = async (interaction: CommandInteraction) => {
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
        await db.insertNewBot(bot?.user?.username, bot?.user.id);
        await interaction.editReply(`Now watching ${bot?.user?.username}`);
    } catch (err) {
        console.error(err);
    }
}