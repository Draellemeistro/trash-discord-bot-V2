const fs = require('node:fs');
const { exec } = require('child_process');
//const normalize = require('ffmpeg-normalize');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, GuildMember} = require('discord.js');

const { token, guildId } = require('./config.json');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ],
    disableMentions: 'everyone',
});

//exec('ffmpeg-normalize sounds/*.mp3 -c:a libmp3lame -b:a 192k -o sounds/normalized/ -f -t -16', (error, stdout, stderr) => {
//    if (error) {
//        console.error(`exec error: ${error}`);
//        return;
//    }
//    console.log(`stdout: ${stdout}`);
//    console.error(`stderr: ${stderr}`);
//});

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

client.once('ready', async () => {
    console.log('Bot is ready!');
    console.log('channels:', client.channels.cache.map(channel => channel.name));
    // const channelId = 'lobby-channel-id'; // Replace with your lobby voice channel ID
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
        console.error('Guild not found');
        return;
    }

    // Fetch all channels of the guild explicitly
    await guild.channels.fetch();

    //// Initialize empty arrays for channel IDs
    //const voiceChannelIds = [];
    //const voiceChannelNames = [];
    //const nonVoiceChannelIds = [];
    //const nonVoiceChannelNames = [];
//
    //// Iterate through all channels in the guild
    //guild.channels.cache.forEach(channel => {
    //    if (channel.type === 2) {
    //        // If the channel is a voice channel, add its ID to the voiceChannelIds array
    //        voiceChannelIds.push(channel.id);
    //        voiceChannelNames.push(channel.name);
    //    } else {
    //        // If the channel is not a voice channel, add its ID to the nonVoiceChannelIds array
    //        nonVoiceChannelIds.push(channel.id);
    //        nonVoiceChannelNames.push(channel.name);
    //    }
    //});

    // Log the arrays to the console
    //console.log('Voice Channel IDs:', voiceChannelIds);
    //console.log('Voice Channel Names:', voiceChannelNames);
    //console.log('Non-Voice Channel IDs:', nonVoiceChannelIds);
    //console.log('Non-Voice Channel Names:', nonVoiceChannelNames);

    // Fetch all voice channels of the guild
    // Find channel where specific user (userid = 266304791393730571) is connected
    const superUserId = '266304791393730571';
    let userVoiceChannelId = null;
    guild.channels.cache.forEach(channel => {
        if (channel.type === 2) {
            if (channel.members.has(superUserId)) {
                console.log(`Drippy is in: ${channel.name} (${channel.id})`);
                userVoiceChannelId = channel.id;
            }
        }
    });


    //const connection = joinVoiceChannel({
    //    channelId: userVoiceChannelId,
    //    guildId: guild.id,
    //    adapterCreator: guild.voiceAdapterCreator,
    //});

    //const player = createAudioPlayer();
    //const resource = createAudioResource(path.join(__dirname, 'sounds/donnie.mp3')); // Adjust the path to your sound file
//
    //player.play(resource);
    //connection.subscribe(player);
//
    //player.on(AudioPlayerStatus.Idle, () => {
    //    connection.destroy(); // Leave the channel after playing the sound
    //});
    //setTimeout(function(){
    //    console.log("Executed after 1 second");
    //    connection.destroy();
    //}, 3000);

});

client.login(token);
