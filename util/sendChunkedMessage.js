// TODO:
// - should prevent splitting words
// - should avoid busting Markdown
// - optimize to end needlessly splitting/joining chunks

// INSTEAD OF SPLITTING UP A LARGE STRING, PASS IN A COLLECTION OF < LIMIT-SIZED CHUNKS
// THAT CAN BE COMPILED INTO LARGER MESSAGES

const DISCORD_MESSAGE_LIMIT = 2000;

// // splits a string into an array of `size` length characters
// function chunkString(str, size) {
//     const numChunks = Math.ceil(str.length / size),
//         chunks = new Array(numChunks);
//
//     for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
//         chunks[i] = str.substr(o, size);
//     }
//
//     return chunks;
// }
//
// // takes a long message (>2000 chars) and breaks it down and sends it as multiple smaller messages
// function sendChunkedMessage(bot, channel, message) {
//     let chunks = chunkString(message, DISCORD_MESSAGE_LIMIT);
//
//     if (chunks.length) {
//         bot.sendMessage(channel, chunks.shift(), err => {
//             if (!err) {
//                 sendChunkedMessage(bot, channel, chunks.join(''));
//             } else {
//                 console.log(err);
//             }
//         });
//     }
// }

function sendChunks(chunks, bot, channel) {
    let compiled = '';

    for (let chunk of chunks) {
        if (chunk.length > DISCORD_MESSAGE_LIMIT) {
            throw new Error(`chunk too long (${chunk.length} characters): sendChunks limit is ${DISCORD_MESSAGE_LIMIT} characters`);
        }

        if ((compiled + chunk).length > DISCORD_MESSAGE_LIMIT) {
            bot.sendMessage(channel, compiled);
            compiled = chunk;
        } else {
            compiled += chunk;
        }
    }

    if (compiled !== '') {
        bot.sendMessage(channel, compiled);
    }
}

module.exports = sendChunks;
