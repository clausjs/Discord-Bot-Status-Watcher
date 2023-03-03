import {
    CommandInteraction, GuildMember
} from 'discord.js';
import { Database, getDatabaseInstance } from '../database';
import { Watchers } from '../Watchers';
const db: Database = getDatabaseInstance();

export const watchbot = async (interaction: CommandInteraction, watchers: Watchers) => {
    await interaction.deferReply({ ephemeral: true });
    
    let bot: GuildMember;
    if (interaction.isChatInputCommand()) {
        bot = interaction.options.getMentionable('bot') as GuildMember;
        if (!bot) {
            await interaction.editReply("Bot not found");
            return;
        }
    } else return;

    const { value: ttr } = interaction.options.get('ttr') || { value: null };

    try {
        let options: { timeToReport: number } | undefined;
        if (ttr) options = { timeToReport: ttr as number };
        const exists: boolean | undefined = await db.insertNewBotIfNotExists(bot?.user?.username, bot?.user.id, options);
        if (exists) {
            await interaction.editReply(`Already watching ${bot?.user?.username}.`);
            return;
        } else if (exists === undefined) {
            await interaction.editReply(`Error adding ${bot?.user?.username}. For more information, check the logs.`);
            return;
        }
        await watchers.addBot({ name: bot?.user?.username, bot_id: bot?.user.id, options})
        await interaction.editReply(`Now watching ${bot?.user?.username}`);
    } catch (err) {
        console.error(err);
    }
}