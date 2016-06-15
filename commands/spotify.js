const config = require('../config'),
    https = require('https'),
    pg = require('pg');

function doSubCommand(subCmd, accessToken, args, bot, msg) {
    if (subCmd === 'search') {
        doSearch(accessToken, args, bot, msg);
    } else if (subCmd === 'whoami') {
        doWhoAmI(accessToken, bot, msg);
    }
}

// TODO: refactor this mess...
function doSearch(accessToken, cmdArgs, bot, msg) {
    let opts = {
            host: 'api.spotify.com',
            path: '/v1/search?type=album,artist,track&q=' + encodeURIComponent(cmdArgs.join(' ')),
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`
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

// TODO: refactor this mess...
function doWhoAmI(accessToken, bot, msg) {

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

        pg.connect(config.PG_CONNECTION_STRING, (err, client, done) => {
            const handleError = (err) => {
                if (!err) {
                    return false;
                }

                if (client) {
                    done(client);
                }

                console.log(err);
                return true;
            };

            if (handleError(err)) {
                return;
            }

            // grab access_token and issue sub-command
            client.query('SELECT * FROM oauth WHERE id = $1', [msg.sender.id], (err, result) => {
                if (handleError(err)) {
                    return;
                }

                // no record
                if (!result.rows.length) {
                    // fetch oauth tokens
                    auth.getOAuthAccessToken('', {'grant_type': 'client_credentials'}, (e, accessToken, refreshToken, results) => {
                        if (handleError(e)) {
                            return;
                        }

                        // insert new oauth record
                        client.query('INSERT INTO oauth VALUES ($1, $2, $3)', [msg.sender.id, accessToken, refreshToken], (err, result) => {
                            if (handleError(err)) {
                                return;
                            }
                        });

                        doSubCommand(subCmd, accessToken, args, bot, msg);
                    });
                    
                    return;
                }

                const accessToken = result.rows[0].access_token;

                // TODO: check expiry and refresh if expired

                doSubCommand(subCmd, accessToken, args, bot, msg);

                done();
            });
        });

        // grab token if needed
        // if (/*needsToken*/true) {
        //     auth.getOAuthAccessToken('', {'grant_type': 'client_credentials'}, (e, accessToken, refreshToken, results) => {
        //         // TODO: store refreshToken
        //
        //         if (subCmd === 'search') {
        //             doSearch(results, args, bot, msg);
        //         }
        //     });
        // }
    }
};
