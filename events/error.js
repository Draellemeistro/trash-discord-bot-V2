const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: Events.Error,
    execute(error) {
        console.error(`An error event was sent by Discord.js: \n${JSON.stringify(error, null, 2)}`);
        const errorFilePath = path.join(__dirname, 'error_log.txt');
        const errorStream = fs.createWriteStream(errorFilePath, { flags: 'a' });

        errorStream.write(`An error event was sent by Discord.js: \n${JSON.stringify(error, null, 2)}\n`);
        errorStream.end();
    },
}