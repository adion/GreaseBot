// TODO:
// - should prevent splitting words
// - should avoid busting Markdown
// - optimize to end needlessly splitting/joining chunks

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
                sendChunkedMessage(bot, channel, chunks.join(''));
            } else {
                console.log(err);
            }
        });
    }
}

module.exports = sendChunkedMessage;
