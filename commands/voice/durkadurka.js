const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('durkadurka')
        .setDescription('durka durka'),
    async execute(interaction) {
        const guild = interaction.client.guilds.cache.get(interaction.guildId);
        const member = guild.members.cache.get(interaction.user.id);
        const voiceChannelId = member.voice.channelId;

        if (!voiceChannelId) {
            await interaction.reply('You need to be in a voice channel to use this command!');
            return;
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(path.join(__dirname, '..', '..', 'sounds', 'durka.mp3')); // Adjust the path to your sound file

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy(); // Leave the channel after playing the sound
        });
        },
};