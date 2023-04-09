import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} from '@discordjs/voice';
import {SlashCommandBuilder} from 'discord.js';

import client from '../app.js';
import sdk from '../utils/api.js';
import {downloadSound} from '../utils/common.js';

export const data = new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Play random meme')
    .addStringOption((option) => option.setName('input').setDescription('The input'));
export async function execute(interaction) {
    const searchString = interaction.options.getString('input');

    const player = createAudioPlayer();

    player.on('error', (error) => {
        console.error('Error:', error.message, 'with track', error.resource.metadata.title);
    });

    player.on(AudioPlayerStatus.Playing, () => {
        console.log('The audio player has started playing!');
    });

    const Guild = client.guilds.cache.get(interaction.guild.id);
    const Member = Guild.members.cache.get(interaction.user.id);

    const connection = joinVoiceChannel({
        channelId: Member.voice.channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    connection.subscribe(player);

    if (searchString) {
        const soundFilePath = await downloadSound(searchString);
        const resource = createAudioResource(soundFilePath, {
            inlineVolume: true,
        });
        player.play(resource);
        interaction.reply('Play!');
    } else {
        const {data: responseData} = await sdk.random();

        const {id, title, duration} = responseData;

        let list = '```';
        list += id + '\t' + duration + 's \t' + title + '\n';
        list += '```';

        const soundFilePath = await downloadSound(id);
        const resource = createAudioResource(soundFilePath, {
            inlineVolume: true,
        });
        player.play(resource);
        interaction.reply(list);
    }
}
