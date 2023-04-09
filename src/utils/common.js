import {createWriteStream, unlink} from 'fs';
import {get} from 'http';
import {join} from 'node:path';

import {SOUNDS_DIR, __DIRNAME} from '../constants.js';

export function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(SOUNDS_DIR + dest);
        get(url, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(resolve); // close() is async, call cb after close completes.
            });
        }).on('error', function (err) {
            // Handle errors
            unlink('sounds/' + dest); // Delete the file async. (But we don't check the result)
            reject(err);
        });
    });
}

export const downloadSound = async (id) => {
    await download(`http://api.cleanvoice.ru/myinstants/?type=file&id=${id}`, `${id}.mp3`);
    return join(__DIRNAME, '../sounds/' + id + '.mp3');
};
