const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        // interaction.guild is the object representing the Guild in which the command was run
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp((`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`), {ephemeral: true});
        } else {
            await interaction.reply((`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`), {ephemeral: true});
        }
    },
};