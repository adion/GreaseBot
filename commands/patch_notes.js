'use strict';

const http = require('http');

// splits a string into an array of `size` length characters
function chunkString(str, size) {
    const numChunks = Math.ceil(str.length / size),
        chunks = new Array(numChunks);

    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
        chunks[i] = str.substr(o, size);
    }

  return chunks;
}

// TODO: should prevent breaking words and Markdown
// takes a long message (>2000 chars) and breaks it down and sends it as multiple smaller messages
function sendChunkedMessage(bot, channel, message) {
    let chunks = chunkString(message, 2000);

    if (chunks.length) {
        bot.sendMessage(channel, chunks.shift(), err => {
            if (!err) {
                sendChunkedMessage(bot, channel, chunks.join(''));
            } else {
                console.log(err);
            }
        });
    }
}

// performs a basic http GET
function doHttpGet(url, done) {
    http.get(url, res => {
        let data = '';

        res.on('data', d => {
            data += d;
        });

        res.on('end', () => {
            done(data);
        });
    });
}

// supported games
const SUPPORTED_GAMES = {
    // hots: {
    //     displayName: 'Heroes of the Storm',
    //     listingUrl: 'http://us.battle.net/heroes/en/search?f=article&k=Patch%20Notes&sort=time&dir=d',
    //     scrape(doneCallback) {
    //
    //     }
    // },
    overwatch: {
        displayName: 'Overwatch',
        listingUrl: 'http://overwatch.wikia.com/api/v1/Articles/List?category=Patch+notes',
        contentsUrl: 'http://overwatch.wikia.com/api/v1/Articles/AsSimpleJson?id=',
        fetch(options, done) {
            const HEADING_LEVELS = ['__**%s**__', '***%s***', '**%s**'],
                listingCallback = (data) => {
                    const listings = JSON.parse(data),
                        patches = listings.items.filter(item => {
                                return item.title !== 'List of Patches';
                            }).sort((a, b) => {
                                const regex = /^([\w,\s]*)(?:\(beta\))?$/,
                                    aMatches = a.title.match(regex),
                                    bMatches = b.title.match(regex),
                                    aDate = new Date(aMatches[1]),
                                    bDate = new Date(bMatches[1]);

                                return aDate - bDate;
                            }).reverse(),
                        patch = patches[options.patchesAgo];

                    doHttpGet(this.contentsUrl + patch.id, contentsCallback);
                },
                contentsCallback = (data) => {
                    const buildContent = (elements, content) => {
                            return elements.reduce((prev, cur) => {
                                const delimeter = cur.type === 'paragraph' ? '\n' : '- ',
                                    text = cur.text ? delimeter + cur.text : '';

                                return buildContent(cur.elements || [], (prev ? prev + '\n' + text : text));
                            }, content);
                        },
                        compileSectionContents = (prev, cur) => {
                            let content = buildContent(cur.content);

                            content = HEADING_LEVELS[cur.level - 1].replace('%s', cur.title) +
                                (content ? '\n' + content : '');

                            return (prev ? prev + '\n' + content : content) + '\n';
                        },
                        contents = JSON.parse(data),
                        compiled = `${this.displayName} patch notes for ` +
                            contents.sections.reduce(compileSectionContents, null);

                    done(compiled);
                };

            // go get it!
            doHttpGet(this.listingUrl, listingCallback);
        }
    }
};

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
        const gameName = args[0];
        if (Object.keys(SUPPORTED_GAMES).indexOf(gameName) < 0) {
            bot.sendMessage(msg.channel, `I don\'t know anything about "${gameName}"!`);
            return;
        }

        // fetch away!
        const game = SUPPORTED_GAMES[gameName],
            patchesAgo = parseInt(args[1], 10) || 0;

        game.fetch({patchesAgo}, results => {
            sendChunkedMessage(bot, msg.channel, results);
        });
    }
};
