const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioResource, createAudioPlayer, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playsound')
        .setDescription('Pshit probably dont work yet FYI.')
        .addStringOption(option =>
            option.setName('sound')
                .setDescription('The name of the sound file to play')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.voice.channelId) {
            await interaction.reply('You need to be in a voice channel to use this command!');
            return;
        }

        const soundName = interaction.options.getString('sound');
        const soundPath = path.join(__dirname, `../../sounds/${soundName}.mp3`);

        const channel = interaction.member.voice.channel;
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        const player = createAudioPlayer();
        const resource = createAudioResource(soundPath);

        player.play(resource);
        connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
            connection.destroy(); // Leave the channel after playing the sound
        });
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('Playing sound...', { ephemeral: true });
        } else {
            await interaction.reply('Playing sound...', { ephemeral: true });
        }
    },
};