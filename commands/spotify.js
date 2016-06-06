const config = require('../config'),
    https = require('https'),
    pg = require('pg');

// TODO: refactor this mess...
function doSearch(results, cmdArgs, bot, msg) {
    let opts = {
            host: 'api.spotify.com',
            path: '/v1/search?type=album,artist,track&q=' + encodeURIComponent(cmdArgs.join(' ')),
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': results.token_type + ' ' + results.access_token
            }
        },
        search = https.request(opts, (res) => {
            let chunks = '';

            res.setEncoding('utf8');
            res.on('data', chunk => {
                chunks += chunk;
            });
            res.on('end', () => {
                let err, data, message;

                try {
                    data = JSON.parse(chunks);
                } catch (e) {
                    console.log('Spotify \'search\' response errored:', e);
                }

                // search returned results; dump them out
                message = 'Found ' + Object.keys(data).join(', ') + ':\n';

                Object.keys(data).forEach((entity) => {
                    message += '\n**' + entity + ' (' + data[entity].items.length + ')**\n' +
                        data[entity].items.reduceRight((memo, item) => {
                            return (memo !== '' ? memo + ', ' : memo) + item.name;
                        }, '') + '\n';
                });

                bot.sendMessage(msg.channel, message);
            });
        }).on('error', err => {
            console.log('Spotify \'search\' request errored:', err);
        });

    search.end();
}

// list of possible spotify commands
const subCommands = ['search'];

module.exports = {
    description: 'provides access to the Spotify API',
    process: (bot, msg, args) => {
        let OAuth = require('oauth'),
            auth = new OAuth.OAuth2(
                config.SPOTIFY_CLIENT_ID,
                config.SPOTIFY_CLIENT_SECRET,
                'https://accounts.spotify.com/',
                null,       // authorize path
                'api/token',
                null        // custom headers
            ),
            subCmd = args.shift();

        // sub-command not supported; bail
        if (subCommands.indexOf(subCmd) < 0) {
            return;
        }

        // TODO: check if token expired
        // grab token if needed
        if (/*needsToken*/true) {
            auth.getOAuthAccessToken('', {'grant_type': 'client_credentials'}, (e, accessToken, refreshToken, results) => {
                // TODO: store refreshToken

                if (subCmd === 'search') {
                    doSearch(results, args, bot, msg);
                }
            });
        }
    }
};
