'use strict';

module.exports = {
    'help': {
        description: 'prints usage information for bot commands',
        usage: '!help [command]',
        process: (bot, msg, args) => {

            // no additional args: display all commands
            if (!args.length) {
                const commands = `Help with what command?\n- ` +
                    Object.keys(module.exports).sort().join('\n- ');

                bot.sendMessage(msg.channel, commands);
                return;
            }

            debugger;
            const command = args[0],
                {description, usage} = module.exports[command];

            bot.sendMessage(msg.channel, `\`${command}\` ${description}\n\n${usage}`);
        }
    },

    'patch_notes': require('./patch_notes'),

    'ping': {
        description: 'responds with "pong"',
        usage: '!ping',
        process: (bot, msg, args) => {
            bot.sendMessage(msg.channel, msg.sender + ' pong');
        }
    },

    'rickyism': {
        description: 'a random bit of knowledge from our pal, Ricky',
        usage: '!rickyism',
        process: (bot, msg, args) => {
            const rickyisms = require('./rickyisms.json'),
                rickyism = rickyisms[Math.floor(Math.random() * rickyisms.length)];

            bot.sendMessage(msg.channel, rickyism);
        }
    }
};
