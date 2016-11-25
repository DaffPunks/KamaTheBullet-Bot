"use strict";


var http = require('http');
var fs = require('fs');

function download(url, dest, cb) {
    var file = fs.createWriteStream("sounds/"+dest);
    var request = http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(cb);  // close() is async, call cb after close completes.
        });
    }).on('error', function (err) { // Handle errors
        fs.unlink("sounds/"+dest); // Delete the file async. (But we don't check the result)
        if (cb) cb(err.message);
    });
}

function getJSON(options, onResult) {
    console.log("rest::getJSON");

    var prot = options.port == 443 ? https : http;
    var req = prot.request(options, function (res) {
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            output += chunk;
        });

        res.on('end', function () {
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function (err) {
        //res.send('error: ' + err.message);
    });

    req.end();
}

function play(info, sample) {
    if (!client.VoiceConnections.length) {
        return console.log("Voice not connected");
    }

    if (!info) info = client.VoiceConnections[0];

    var mp3decoder = new lame.Decoder();
    var file = fs.createReadStream("sounds/"+sample);
    file.pipe(mp3decoder);

    mp3decoder.on('format', pcmfmt => {
        // note: discordie encoder does resampling if rate != 48000
        var options = {
            frameDuration: 60,
            sampleRate: pcmfmt.sampleRate,
            channels: pcmfmt.channels,
            float: false
        };

        var encoderStream = info.voiceConnection.getEncoderStream(options);
        if (!encoderStream) {
            return console.log(
                "Unable to get encoder stream, connection is disposed"
            );
        }

        encoderStream.resetTimestamp();
        encoderStream.removeAllListeners("timestamp");
        encoderStream.on("timestamp", time => console.log("Time " + time));

        mp3decoder.pipe(encoderStream);

        encoderStream.once("unpipe", () => file.destroy());
    });
}


var lame = require('lame');

var Discordie;
try {
    Discordie = require("/");
} catch (e) {
}
try {
    Discordie = require("discordie");
} catch (e) {
}

var client = new Discordie({autoReconnect: true});

var auth = {token: "MjQzNjg2NDk0NzUyMDc5ODcy.CvyuIQ.AcpbA0mzNJe_MwrIya8ZloG-m3g"};
try {
    auth = require("./auth");
} catch (e) {
}

client.connect(auth);


client.Dispatcher.on("GATEWAY_READY", e => {
    client.User.setGame("?help? | ЕЖЖИИИ");

    const guild = client.Guilds.getBy("name", "Уебеки");
    if (!guild) return console.log("Guild not found");

    const general = guild.voiceChannels.find(c => c.name == "general");
    if (!general) return console.log("Channel not found");

    var info = client.VoiceConnections.getForGuild(general);
    return general.join(false, false).then(() => play(info, "kama/kama-game.mp3"));
});

/*
 ----------------------------On Message Created--------------------------
 */
client.Dispatcher.on("MESSAGE_CREATE", e => {

    const startMessage = e.message.content.toLowerCase();
    const channel = e.message.channel;
    const guild = e.message.channel.guild;

    if (startMessage.indexOf("") == 0) {
        const content = startMessage.replace("", "");

        if (content == "что такое игрушка дьявола?" || content == "игрушка дьявола") {
            var info = client.VoiceConnections.getForGuild(guild);
            if (info) play(info, "kama/kama-game.mp3");
        }

        if (content == "сасать" || content == "sasat") {
            var info = client.VoiceConnections.getForGuild(guild);
            if (info) play(info, "kama/sasat.mp3");
        }

        /**
         * KAMA JOIN IN CURRENT SERVER
         */
        if (content == "кама уходи" || content == "уходи") {
            channel.sendMessage("Ща");
            client.Channels
                .filter(channel => channel.type == 2 && channel.joined)
                .forEach(channel => channel.leave());
        }

        /**
         * PlayMeme by id
         */
        if (content.indexOf("playmeme ") == 0 || content.indexOf("pm ") == 0) {
            if (content.indexOf("playmeme ") == 0){
                var targetSpace = content.replace("playmeme ", "");
            }
            if (content.indexOf("pm ") == 0){
                var targetSpace = content.replace("pm ", "");
            }
            const target = targetSpace.replace(/ /g, "%20");


            download("http://api.cleanvoice.ru/myinstants/?type=file&id=" + target, target + ".mp3", function () {
                var info = client.VoiceConnections.getForGuild(guild);
                if (info) play(info, target + ".mp3");
            });

            var options = {
                host: 'api.cleanvoice.ru',
                path: '/myinstants/?type=single&id=' + target,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            getJSON(options,
                function (statusCode, result) {
                    if (result) {
                        var list = '```';
                        list +=     result.title + "\t" + result.duration + "\n";
                        list += "```";
                        channel.sendMessage(list);
                    } else {
                        channel.sendMessage("```Not Found```");
                    }

                });
        }

        if (content.indexOf("randommeme") == 0 || content.indexOf("rm") == 0) {

            var options = {
                host: 'api.cleanvoice.ru',
                path: '/myinstants/?type=single',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            getJSON(options,
                function (statusCode, result) {
                    if (result) {
                        var list = '```';
                        list +=  result.id + "\t" + result.title + "\t" + result.duration + "\n";
                        list += "```";
                        channel.sendMessage(list);

                        download("http://api.cleanvoice.ru/myinstants/?type=file&id=" + result.id, result.id + ".mp3", function () {
                            var info = client.VoiceConnections.getForGuild(guild);
                            if (info) play(info, result.id + ".mp3");
                        });

                    } else {
                        channel.sendMessage("```Not Found```");
                    }

                });
        }

        /**
         * Search and Play Meme
         */
        if (content.indexOf("searchmeme ") == 0 || content.indexOf("sm ") == 0) {
            if (content.indexOf("searchmeme ") == 0){
                var targetSpace = content.replace("searchmeme ", "");
            }
            if (content.indexOf("sm ") == 0){
                var targetSpace = content.replace("sm ", "");
            }
            const target = targetSpace.replace(/ /g, "%20");

            console.log(target);

            var options = {
                host: 'api.cleanvoice.ru',
                path: '/myinstants/?type=many&search=' + target + '&offset=0&limit=10',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            getJSON(options,
                function (statusCode, result) {
                    if (result.items[0] != undefined) {
                        var list = '```';
                        for (var i = 0; i < result.items.length; i++) {
                            list += result.items[i].id + "\t" + result.items[i].duration + "\t" + result.items[i].title + "\n";
                        }
                        list += "```";
                        channel.sendMessage(list);
                    } else {
                        channel.sendMessage("```Not Found```");
                    }

                });
        }

        if (content.indexOf("playsearchmeme ") == 0 || content.indexOf("psm ") == 0) {
            if (content.indexOf("playsearchmeme ") == 0){
                var targetSpace = content.replace("playsearchmeme ", "");
            }
            if (content.indexOf("psm ") == 0){
                var targetSpace = content.replace("psm ", "");
            }
            const target = targetSpace.replace(/ /g, "%20");

            console.log(target);

            var options = {
                host: 'api.cleanvoice.ru',
                path: '/myinstants/?type=many&search=' + target + '&offset=0&limit=10',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            getJSON(options,
                function (statusCode, result) {
                    if (result.items[0]) {
                        var list = '```';
                        list += result.items[0].id + "\t" + result.items[0].duration + "\t" + result.items[0].title + "\n";
                        list += "```";

                        channel.sendMessage(list);

                        var id = result.items[0].id;

                        download("http://api.cleanvoice.ru/myinstants/?type=file&id=" + id, id + ".mp3", function () {
                            var info = client.VoiceConnections.getForGuild(guild);
                            if (info) play(info, id + ".mp3");
                        });
                    } else {
                        channel.sendMessage("```Not Found```");
                    }

                });
        }

        if (content.indexOf("заходи") == 0) {
            e.message.author.getVoiceChannel(guild).join().then(info => play(info, "kama/kama-game.mp3"));
        }

        if (content == "кама, въеби ему" || content.indexOf("ча") == 0 || content.indexOf("ша") == 0 || content.indexOf("та") == 0) {
            if (!client.VoiceConnections.length) {
                return e.message.reply("Ты шабишь чтоли?");
            }
            var info = client.VoiceConnections.getForGuild(guild);
            if (info) play(info, "kama/kama_chaa.mp3");
        }

        if (content.indexOf("stop") == 0) {
            var info = client.VoiceConnections.getForGuild(guild);
            if (info) {
                var encoderStream = info.voiceConnection.getEncoderStream();
                encoderStream.unpipeAll();
            }
        }

        if (content == "кто твой папа?") {
            return e.message.reply("Дафф, батя, красавец");
        }

        if (content == "?help?") {
            channel.sendMessage("```Markdown" + "\n" +
                "# pm \<id\> OR playmeme \<id\> - play meme by id" + "\n" +
                "# sm \<name\> OR searchmeme \<name\> - search meme" + "\n" +
                "# psm \<name\> OR playsearchmeme \<name\> - search and play first meme" +"\n" +
                "# rm OR randommeme - play random meme" +"\n" +
                "# stop - stop playing meme" +"\n" +
                "# Чааа (Шааа, Тааа)" + "\n" +
                "# Заходи" + "\n" +
                "# Уходи" + "\n" +
                "# Игрушка дьявола" + "\n" +
                "# Кто твой Папа?" + "\n" +
                "```");
        }
    }
});

client.Dispatcher.on("VOICE_CHANNEL_JOIN", e => {
    var info = client.VoiceConnections.getForGuild(e.channel.guild);
    if (info) play(info, "kama/smoke.mp3");
});

client.Dispatcher.on("VOICE_USER_SELF_MUTE", e => {
    var info = client.VoiceConnections.getForGuild(e.channel.guild);
    if (info) play(info, "kama/calmdown.mp3");
});


client.Dispatcher.onAny((type, e) => {

    console.log("\nevent " + type);
});
