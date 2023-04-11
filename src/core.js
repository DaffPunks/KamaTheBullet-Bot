import {Collection, Events} from 'discord.js';

import client from './app.js';
import commands from './commands/index.js';
import {token} from './config.js';

export const init = () => {
    // Login
    client.once(Events.ClientReady, (c) => console.log(`Ready! Logged in as ${c.user.tag}`));
    client.login(token);

    // Initialize commands objects
    client.commands = new Collection();

    for (const [key, command] of Object.keys(commands)) {
        if ('config' in command && 'execute' in command) {
            client.commands.set(command.config.name, command);
        } else {
            console.log(
                `[WARNING] The command "${key}" is missing a required "data" or "execute" property.`,
            );
        }
    }

    // Initialize commands interaction
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true,
                });
            }
        }
    });
};
