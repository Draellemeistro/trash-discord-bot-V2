const { SlashCommandBuilder } = require("discord.js");
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const os = require('os');
const pythonPath = path.join(__dirname, '..', '..', 'pythonFaceOverlayer');
const scriptPath = path.join(pythonPath, 'run_faces.sh');
const imgPath = path.join(__dirname, '..', '..', 'output.jpg');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('face-inate')
        .setDescription('face-inater-inater')
        .addSubcommand(subcommand =>
            subcommand
                .setName('overlay')
                .setDescription('overlay faces on an image')
                .addAttachmentOption(option => option.setName('file')
                    .setDescription('file to overlay')
                    .setRequired(true))
                .addStringOption(option =>
                    option.setName('person')
                        .setDescription('person to overlay')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('other_people')
                        .setDescription('people to overlay, separated by commas: "person1, person2, person3"')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('people')
                .setDescription('show people available to use as overlays')),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        let commandStr = `${scriptPath}`;
        let tempFilePath;

        if (subcommand === 'overlay') {
            const file = interaction.options.getAttachment('file');
            const person = interaction.options.getString('person');
            const otherPeople = interaction.options.getString('other_people');

            // Download the image
            const response = await axios.get(file.url, { responseType: 'arraybuffer' });
            tempFilePath = path.join(os.tmpdir(), 'temp_image.png');
            fs.writeFileSync(tempFilePath, response.data);

            commandStr += ` overlay ${tempFilePath} ${person}`;
            if (otherPeople) {
                const trimmedPeople = otherPeople.split(',').map(person => person.trim()).join(' ');
                commandStr += ` ${trimmedPeople}`;
            }
        } else if (subcommand === 'people') {
            commandStr += ` people`;
        }

        // Ensure the script is executable
        fs.chmodSync(scriptPath, '755');

        const process = spawn(commandStr, { shell: true });

        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`stdout: ${output}`);

            if (output.includes('Saving image')) {
                if (interaction.replied || interaction.deferred) {
                    console.log('Replying with image');
                    interaction.followUp({ files: [imgPath] });
                } else {
                    interaction.reply({ files: [imgPath] });
                }
            }
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        process.on('close', (code) => {
            if (code !== 0) {
                if (interaction.replied || interaction.deferred) {
                    interaction.followUp(`Process exited with code ${code}`);
                } else {
                    interaction.reply(`Process exited with code ${code}`);
                }
            }
            // Clean up the temporary file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        });
    }
};