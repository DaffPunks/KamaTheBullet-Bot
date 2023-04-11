import {SlashCommandBuilder} from 'discord.js';

import sdk from '../utils/api.js';

export const config = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Search meme')
    .addStringOption((option) => option.setName('input').setDescription('The input'));

export async function execute(interaction) {
    const string = interaction.options.getString('input');

    const {data: requestData} = await sdk.search({query: {search: string}});

    if (requestData.items.length) {
        const {items} = requestData;

        let list = '```';
        for (const item of items) {
            const {id, duration, title} = item;
            list += id + '\t' + duration + 's \t' + title + '\n';
        }
        list += '```';
        await interaction.reply(list);
    } else {
        await interaction.reply('```Not Found```');
    }
}
