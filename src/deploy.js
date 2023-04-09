import {readdirSync} from 'node:fs';
import {join} from 'node:path';

import {REST, Routes} from 'discord.js';

import {__DIRNAME} from './constants.js';
import config from './config.json' assert { type: "json" }; 

const {clientId, guildId, token} = config;

const commands = []
const commandsPath = join(__DIRNAME, 'commands');
const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    // eslint-disable-next-line global-require, security/detect-non-literal-require
    const command = await import(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({version: '10'}).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
