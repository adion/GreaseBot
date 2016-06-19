'use strict';

// supported games
const SUPPORTED_GAMES = {
    'hots': {
        displayName: 'Heroes of the Storm',
        listingUrl: 'http://us.battle.net/heroes/en/search?f=article&k=Patch%20Notes&sort=time&dir=d'
    },
    'overwatch': {
        displayName: 'Overwatch',
        listingUrl: 'http://us.battle.net/forums/en/overwatch/21446648/'
    }
};

// splits a string into an array of `size` length characters
function chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size),
        chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size);
    }

  return chunks;
}

// takes a long message (>2000 chars) and breaks it down and sends it as multiple smaller messages
function sendChunkedMessage(bot, channel, message) {
    let chunks = chunkString(message, 2000);

    if (chunks.length) {
        bot.sendMessage(channel, chunks.shift(), err => {
            if (!err) {
                sendChunkedMessage(bot, msg, chunks.join(''));
            } else {
                console.log(err);
            }
        });
    }
}

module.exports = {
    description: 'grabs the latest Blizzard patch notes for the given game',
    process: (bot, msg, args) => {

        // dump supported games if no game is specified
        if (!args.length) {
            const games = Object.keys(SUPPORTED_GAMES).reduce((prev, cur) => {
                return (prev ? `${prev}\n` : '\n') + `→ ${SUPPORTED_GAMES[cur].displayName} (*${cur}*)`;
            }, null);

            bot.sendMessage(msg.channel, `I can pull patch notes for the following games: ${games}`);
            return;
        }

        // sub-command isn't recognized; bail
        if (Object.keys(SUPPORTED_GAMES).indexOf(args[0]) < 0) {
            bot.sendMessage(msg.channel, `I don\'t know anything about "${args[0]}"!`);
            return;
        }

        const game = SUPPORTED_GAMES[args[0]],
            osmosis = require('osmosis'),
            toMarkdown = require('to-markdown'),
            results = [];

        // TODO: how to abstract this?
        osmosis.get(game.listingUrl)
            .find('a.ForumTopic')
            .match(/^\s*Overwatch Patch Notes/)
            .set({
                href: '@href',
                title: '.ForumTopic-title',
            })
            .follow('@href')
            .set({body: '.TopicPost-bodyContent:html'})
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
                    const markdown = toMarkdown(results[0].body);

                    // FIXME: this can murder HTML...
                    sendChunkedMessage(bot, msg.channel, markdown);
                } else {
                    bot.sendMessage(msg.channel, 'No patch notes found :confused:');
                }
            });
    }
};
