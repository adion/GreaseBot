'use strict';

const overwatch = require('./games/overwatch'),
    sendChunkedMessage = require('../util/sendChunkedMessage');

// supported games
const SUPPORTED_GAMES = {overwatch},
    gameKeys = Object.keys(SUPPORTED_GAMES);

module.exports = {
    description: 'grabs the latest Blizzard patch notes for the given game',
    usage: `!patch_notes <${gameKeys.join('|')}> [offset]`,
    process: (bot, msg, args) => {

        // dump supported games if no game is specified
        if (!args.length) {
            const games = gameKeys.reduce((prev, cur) => {
                return (prev ? `${prev}\n` : '\n') + `→ ${SUPPORTED_GAMES[cur].displayName} (*${cur}*)`;
            }, null);

            bot.sendMessage(msg.channel, `I can pull patch notes for the following games: ${games}`);
            return;
        }

        // sub-command isn't recognized; bail
        const gameName = args[0];
        if (gameKeys.indexOf(gameName) < 0) {
            bot.sendMessage(msg.channel, `I don't know anything about "${gameName}"!`);
            return;
        }

        // fetch away!
        const game = SUPPORTED_GAMES[gameName],
            patchesAgo = parseInt(args[1], 10) || 0;

        game.fetch({patchesAgo}, results => sendChunkedMessage(bot, msg.channel, results));
    }
};
