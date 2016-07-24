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
        scrape(doneCallback) {
            const HEADING_LEVELS = ['__**%s**__', '***%s***', '**%s**'];

            http.get(this.listingUrl, res => {
                let listingBody = '';

                res.on('data', d => {
                    listingBody += d;
                });

                res.on('end', () => {
                    const listings = JSON.parse(listingBody),
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
                        latest = patches.shift();

                    http.get(this.contentsUrl + latest.id, res => {
                        let contentsBody = '';

                        res.on('data', d => {
                            contentsBody += d;
                        });

                        res.on('end', () => {
                            const buildContent = (elements, content) => {
                                    return elements.reduce((prev, cur) => {
                                        const text = cur.text ? '-' + cur.text : '';
                                        return buildContent(cur.elements, (prev ? prev + '\n' + text : text));
                                    }, content);
                                },
                                contents = JSON.parse(contentsBody),
                                compiled = `${this.displayName} patch notes for ` + contents.sections.reduce((prev, cur) => {
                                    let content = buildContent(cur.content);

                                    content = HEADING_LEVELS[cur.level - 1].replace('%s', cur.title) +
                                        (content ? '\n' + content : '');

                                    return (prev ? prev + '\n' + content : content) + '\n';
                                }, null);

                            doneCallback(compiled);
                        });
                    });
                });
            });
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
        if (Object.keys(SUPPORTED_GAMES).indexOf(args[0]) < 0) {
            bot.sendMessage(msg.channel, `I don\'t know anything about "${args[0]}"!`);
            return;
        }

        // scrape away!
        const game = SUPPORTED_GAMES[args[0]];
        game.scrape(results => {
            sendChunkedMessage(bot, msg.channel, results);
        });
    }
};
