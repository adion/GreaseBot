'use strict';

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

    'patch_notes': require('./patch_notes')
};
