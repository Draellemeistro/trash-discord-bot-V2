//const { Events } = require('discord.js');
//
//module.exports = {
//    name: Events.VoiceStateUpdate,
//    execute(oldState, newState) {
//        if (oldState.channelId === null && newState.channelId !== null) {
//            newState.member.client.emit('voiceJoin', newState);
//        } else if (oldState.channelId !== null && newState.channelId === null) {
//            newState.member.client.emit('voiceLeave', oldState);
//        } else if (oldState.channelId !== newState.channelId) {
//            newState.member.client.emit('voiceSwitch', oldState, newState);
//        }
//    }
//}