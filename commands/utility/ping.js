const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('Pong!', { ephemeral: true });
        } else {
            await interaction.reply('Pong!', { ephemeral: true });
        }
    },
};