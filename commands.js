module.exports = {
    'ping': {
        description: 'responds with "pong"',
        process: (bot, msg, args) => {
            bot.sendMessage(msg.channel, msg.sender + ' pong');
        }
    }
};
