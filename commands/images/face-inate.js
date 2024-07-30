const {SlashCommandBuilder} = require("discord.js");
const path = require('path');
const { spawn } = require('child_process');
const pythonPath = path.join(__dirname, '..', '..', 'pythonFaceOverlayer');
const scriptPath = path.join(pythonPath, 'run_faces.sh');
const imgPath = path.join(pythonPath, 'output.jpg');

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

        const process = spawn(commandStr, { shell: true });

        process.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`stdout: ${output}`);

            if (output.includes('Saving image')) {
                interaction.reply({ files: [imgPath] });
            }
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data.toString()}`);
        });

        process.on('close', (code) => {
            if (code !== 0) {
                interaction.reply(`Process exited with code ${code}`);
            }
        });
    }
};