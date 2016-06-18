'use strict';

function chunkString(str, size) {
  var numChunks = Math.ceil(str.length / size),
      chunks = new Array(numChunks);

  for(var i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substr(o, size);
  }

  return chunks;
}

function sendChunkedMessage(bot, msg, message) {
    let chunks = chunkString(message, 2000);

    if (chunks.length) {
        bot.sendMessage(msg.channel, chunks.shift(), err => {
            if (!err) {
                sendChunkedMessage(bot, msg, chunks.join(''));
            } else {
                console.log(err);
            }
        });
    }
}

module.exports = {
    'ping': {
        description: 'responds with "pong"',
        process: (bot, msg, args) => {
            bot.sendMessage(msg.channel, msg.sender + ' pong');
        }
    },

    'rickyism': {
        description: 'a random bit of knowledge from our pal, Ricky',
        process: (bot, msg, args) => {
            const rickyisms = require('./rickyisms.json'),
                rickyism = rickyisms[Math.floor(Math.random() * rickyisms.length)];

            bot.sendMessage(msg.channel, rickyism);
        }
    },

    'patch_notes': {
        description: 'grabs the latest Blizzard patch notes for the given game',
        process: (bot, msg, args) => {
            const OVERWATCH_ANNOUNCEMENTS_FORUM_URL = 'http://us.battle.net/forums/en/overwatch/21446648/',
                osmosis = require('osmosis'),
                h2t = require('html-to-text'),
                results = [];

            osmosis.get(OVERWATCH_ANNOUNCEMENTS_FORUM_URL)
                .find('a.ForumTopic')
                .match(/^\s*Overwatch Patch Notes/)
                .set({
                    href: '@href',
                    title: '.ForumTopic-title',
                })
                .follow('@href')
                .set({
                    text: '.TopicPost-bodyContent',
                    html: '.TopicPost-bodyContent:html'
                })
                .data(data => {

                    // `a.ForumTopic` contains a nested `a` with its own `@href`
                    // this will cause osmosis to double up each context...
                    // ignore links with fragments (e.g., /foo/bar#post1)
                    if (data.href.indexOf('#') < 0) {
                        results.push(data);
                    }
                })
                .done(() => {

                    // send the latest notes
                    if (results.length) {
                        const formatted = h2t.fromString(results[0].html, {wordwrap: false});

                        sendChunkedMessage(bot, msg, formatted);
                    } else {
                        bot.sendMessage(msg.channel, 'No patch notes found :(');
                    }
                });
        }
    }
};
