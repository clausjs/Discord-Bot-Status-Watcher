import {
    CommandInteraction
} from 'discord.js';
import { Database, getDatabaseInstance } from '../database';
const db: Database = getDatabaseInstance();

export const list = async (interaction: CommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
        const bots = await db.getAllBots();
        await interaction.editReply(`Bots: ${bots}`);
    } catch (err) {
        console.error(err);
    }
}