const { SlashCommandBuilder } = require("discord.js");
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const os = require('os');
const pythonPath = path.join(__dirname, '..', '..', 'pythonFaceOverlayer');
const scriptPath = path.join(pythonPath, 'run_faces.sh');
const imgPath = path.join(__dirname, '..', '..', 'output.jpg');

function formatPersonString(person) {
    // Replace any symbols or numbers with a space
    let cleanedString = person.replace(/[^a-zA-Z\s]/g, ' ');

    // Split the string into words, capitalize the first letter of each word, and join them back
    return cleanedString.split(' ')
        .filter(word => word.length > 0) // Remove any empty strings
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

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
                        .setDescription('people to overlay, separated by commas: "person1, person2, person3"')
                        .setRequired(true)))
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
            const formattedPerson = formatPersonString(person);
            // Download the image
            const response = await axios.get(file.url, { responseType: 'arraybuffer' });
            tempFilePath = path.join(os.tmpdir(), 'temp_image.png');
            fs.writeFileSync(tempFilePath, response.data);
            commandStr += ` overlay ${tempFilePath} ${formattedPerson}`;

            // Ensure the script is executable
            fs.chmodSync(scriptPath, '755');

            const process = spawn(commandStr, { shell: true });

            process.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`stdout: ${output}`);

                if (output.includes('Saving image')) {
                    if (interaction.replied || interaction.deferred) {
                        console.log('Replying with image');
                        interaction.followUp({ files: [imgPath] }).then(() => {
                            if (fs.existsSync(imgPath)) {
                                fs.unlinkSync(imgPath);
                            }
                        });
                    } else {
                        interaction.reply({ files: [imgPath] }).then(() => {
                            if (fs.existsSync(imgPath)) {
                                fs.unlinkSync(imgPath);
                            }
                        });
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
        } else if (subcommand === 'people') {
            const overlaysPath = path.join(pythonPath, 'face_overlays');
            const folders = fs.readdirSync(overlaysPath).filter(file => fs.statSync(path.join(overlaysPath, file)).isDirectory());
            const folderNames = folders.join(', ');
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(`Available overlays: ${folderNames}`);
            } else {
                await interaction.reply(`Available overlays: \n${folderNames}\n\n donate some photos, brev`);
            }
        }
    }
};
