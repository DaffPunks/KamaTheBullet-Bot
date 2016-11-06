"use strict";



var lame = require('lame');
var fs = require('fs');

var Discordie;
try { Discordie = require("/"); } catch(e) {}
try { Discordie = require("discordie"); } catch(e) {}

var client = new Discordie({autoReconnect: true});

var auth = { token: "MjQzNjg2NDk0NzUyMDc5ODcy.CvyuIQ.AcpbA0mzNJe_MwrIya8ZloG-m3g" };
try { auth = require("./auth"); } catch(e) {}

client.connect(auth);

client.Dispatcher.on("GATEWAY_READY", e => {
  const guild = client.Guilds.getBy("name", "test");
  if (!guild) return console.log("Guild not found");

  const general = guild.voiceChannels.find(c => c.name == "General");
  if (!general) return console.log("Channel not found");

  return general.join(false, false);
});

client.Dispatcher.on("MESSAGE_CREATE", (e) => {
  const content = e.message.content;
  const channel = e.message.channel;
  const guild = e.message.channel.guild;

  if (content == "Что такое игрушка дьявола?") {
  	play(null, "kama-game.mp3");
  }

  if (content == "Кама уходи" || content == "Уходи") {
  	channel.sendMessage("Ща");
    client.Channels
    .filter(channel => channel.type == 2 && channel.joined)
    .forEach(channel => channel.leave());
  }

  if (content.indexOf("Заходи") == 0) {
  	e.message.author.getVoiceChannel(guild).join().then(info => play(info, "kama-game.mp3"));
  }

  if (content == "Кама, въеби ему" || content == "Чааа") {
    if (!client.VoiceConnections.length) {
      return e.message.reply("Ты шабишь чтоли?");
    }
    var info = client.VoiceConnections.getForGuild(guild);
    if (info) play(info, "kama_chaa.mp3");
  }

  if (content.indexOf("stop") == 0) {
    var info = client.VoiceConnections.getForGuild(guild);
    if (info) {
      var encoderStream = info.voiceConnection.getEncoderStream();
      encoderStream.unpipeAll();
    }
  } 

  if (content == "Кто твой брат?") {
      return e.message.reply("Дафф, брат, красавец");
  }

  if (content == "Что умеешь дорогой?") {
      e.message.reply("-> Кама, въеби ему");
      e.message.reply("-> Чааа");
      e.message.reply("-> Заходи");
      e.message.reply("-> Что такое игрушка дьявола?");
      e.message.reply("-> Кама уходи");
  }
});

client.Dispatcher.on("VOICE_CHANNEL_JOIN", e => {
  play(null, "smoke.mp3");
});

client.Dispatcher.on("VOICE_USER_SELF_MUTE", e => {
  play(null, "calmdown.mp3");
});

function play(info, sample) {
  if (!client.VoiceConnections.length) {
    return console.log("Voice not connected");
  }

  if (!info) info = client.VoiceConnections[0];

  var mp3decoder = new lame.Decoder();
  var file = fs.createReadStream(sample);
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

    // Stream instance is persistent until voice connection is disposed;
    // you can register timestamp listener once when connection is initialized
    // or access timestamp with `encoderStream.timestamp`
    encoderStream.resetTimestamp();
    encoderStream.removeAllListeners("timestamp");
    encoderStream.on("timestamp", time => console.log("Time " + time));

    // only 1 stream at a time can be piped into AudioEncoderStream
    // previous stream will automatically unpipe
    mp3decoder.pipe(encoderStream);

    // must be registered after `pipe()`
    encoderStream.once("unpipe", () => file.destroy());
  });
}

client.Dispatcher.onAny((type, e) => {

  console.log("\nevent " + type);
  //return console.log("args " + JSON.stringify(e));
});
