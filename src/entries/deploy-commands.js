import {REST, Routes} from 'discord.js';

import commands from '../commands/index.js';
import config from '../config.js';

const {clientId, guildId, token} = config;

const commandsJson = [];

for (const command of Object.values(commands)) {
    commandsJson.push(command.config.toJSON());
}

const rest = new REST({version: '10'}).setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commandsJson,
        });

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();
