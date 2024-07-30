const {SlashCommandBuilder} = require("discord.js");
const path = require('path');
const { exec } = require('child_process');
const pythonPath = path.join(__dirname, '..', '..', 'pythonFaceOverlayer');

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
        let commandStr = `./run_faces.sh`;


        if (subcommand === 'overlay') {
            const file = interaction.options.getAttachment('file');
            const person = interaction.options.getString('person');
            const otherPeople = interaction.options.getString('other people');

            commandStr += ` overlay ${file.url} ${person}`;
            if (otherPeople) {
                const trimmedPeople = otherPeople.split(',').map(person => person.trim()).join(' ');
                commandStr += ` ${trimmedPeople}`;
            }
        } else if (subcommand === 'people') {
            commandStr += ` people`;
        }
        exec(commandStr, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                interaction.reply(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                interaction.reply(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            interaction.reply(`Output: ${stdout}`);
        });
    }
};