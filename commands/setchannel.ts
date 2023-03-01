import {
    CommandInteraction, TextChannel
} from 'discord.js';
import { Database, getDatabaseInstance } from '../database';
const db: Database = getDatabaseInstance();

export const setchannel = async (interaction: CommandInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    
    let channel: TextChannel;
    if (interaction.isChatInputCommand()) {
        channel = interaction.options.getChannel('channel') as TextChannel;
        if (!channel) {
            await interaction.editReply("Channel not found");
            return;
        }
    } else return;

    try {
        const updated: boolean = await db.addChannel(channel.id, channel.guild.id);
        const guild = await interaction.client.guilds.fetch(channel.guild.id);
        if (updated) await interaction.editReply(`Only one channel per guild. Guild: ${guild?.name} updated channel: ${channel.name}.`);
        else await interaction.editReply(`Channel: ${channel.name} added.`);
    } catch (err) {
        console.error(err);
    }
}