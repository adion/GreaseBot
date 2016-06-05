'use strict';

const config = require('./config');

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
            let rickyisms = require('./rickyisms.json'),
                rickyism = rickyisms[Math.floor(Math.random() * rickyisms.length)];

            bot.sendMessage(msg.channel, rickyism);
        }
    },

    'spotify': {
        description: 'provides access to the Spotify API',
        process: (bot, msg, args) => {
            let https = require('https'),
                OAuth = require('oauth'),
                subCmd = args.shift();

            if (subCmd === 'search') {
                let auth = new OAuth.OAuth2(
                        config.SPOTIFY_CLIENT_ID,
                        config.SPOTIFY_CLIENT_SECRET,
                        'https://accounts.spotify.com/',
                        null,       // authorize path
                        'api/token',
                        null        // custom headers
                    );

                auth.getOAuthAccessToken(
                    '',
                    {'grant_type': 'client_credentials'},
                    (e, access_token, refresh_token, results) => {
                        let opts = {
                                host: 'api.spotify.com',
                                path: '/v1/search?type=album,artist,track&q=' + encodeURIComponent(args.join(' ')),
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/json',
                                    'Authorization': results.token_type + ' ' + access_token
                                }
                            },
                            search = https.request(opts, (res) => {
                                let chunks = '';

                                res.setEncoding('utf8');
                                res.on('data', chunk => {
                                    chunks += chunk;
                                });
                                res.on('end', () => {
                                    let err, data;

                                    try {
                                        data = JSON.parse(chunks);
                                    } catch (e) {
                                        console.log('Spotify \'search\' response errored:', e);
                                    }
    debugger;
                                    bot.sendMessage(msg.channel, data.external_urls.spotify + '(' + data.uri + ')');
                                });
                            }
                        ).on('error', err => {
                            console.log('Spotify \'search\' request errored:', err);
                        });

                        search.end();
                    }
                );
            }
        }
    }
};
