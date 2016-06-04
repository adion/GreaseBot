'use strict';

let Discord = require('discord.js'),
    commands = require('./commands');

let bot = new Discord.Client(),
    config = process.env;

try {
    config = Object.assign(config, require('./config.json'));
} catch (e) {
    console.log('config.json missing!');
}

bot.on('ready', () => {
    console.log('GreaseBot online! Connected to servers:');

    bot.servers.forEach(server => {
        console.log(' ✓', server.name);
    })
});

bot.on('disconnected', () => {
    console.log('GreaseBot disconnected!');
    process.exit(1);
});

bot.on('message', msg => {
    // ignore our own messages
    if (msg.author.bot && msg.author.id === bot.user.id) {
        return;
    }

    let isBang = msg.content[0] === '!',
        isMention = msg.content.indexOf(bot.user.mention()) === 0;

    // you've got my attention...:
    // !cmd [args]
    // @Greasebot [!]cmd [args]
    if (isBang || isMention) {
        let msgParts = msg.content.split(' '),
            cmd = isMention ?
                // extracts cmd from '@Greasebot cmd' and '@Greasebot !cmd'
                (msgParts[1] && msgParts[1][0] === '!' ? msgParts[1].substring(1) : msgParts[1])
                // extracts cmd from '!cmd'
                : msgParts[0].substring(1),
            args = msgParts.slice(isMention ? 2 : 1);

        // bot was mentioned without any additional text
        if (!cmd) {
            bot.sendMessage(msg.channel, 'What?!');
            return;
        }

        // process the command (or do nothing for garbage commands)
        if (commands[cmd]) {
            commands[cmd].process(bot, msg, args);
        }
    }
});

// gre-he-easy!
bot.loginWithToken(config.BOT_TOKEN, err => {
    if (err) {
        console.log('GreaseBot could not login!', err);
    }
});
