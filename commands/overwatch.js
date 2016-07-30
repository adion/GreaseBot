'use strict';

const cheerio = require('cheerio'),
    request = require('request');

const BATTLE_NET_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36'
    },
    BATTLE_TAG_REGEX = /^.+#{1}\d+$/,
    OVERWATCH_STATS_BASE_URL = 'https://playoverwatch.com/en-us/career/pc/us/';

// returns a root selector for the given context string
function getContext(ctx) {
    const COMPETITIVE_STRINGS = ['cp', 'comp', 'competitive', 'competitive-play'];

    if (ctx) ctx = ctx.toLowerCase();

    return COMPETITIVE_STRINGS.indexOf(ctx) > -1 ? 'competitive-play' : 'quick-play';
}

// returns a table reference that contains the given header text
function getTable($, $context, val) {
    return $context.find('.js-stats.is-active .data-table')
        .filter((i, el) => $(el).find('.stat-title').text() === val);
}

// removes formatting characters from displayed numeric values
function unformat(val) {
    return val.replace(/[,]/g, '');
}

// returns the metric from a table for the given associated label
function getTableValue($, $table, val) {
    const raw = $table.find('td')
        .filter((i, el) => $(el).text() === val).eq(0)
        .next().text();

    return parseInt(unformat(raw), 10);
}

// returns all metrics for a given table
function getAllTableValues($, $table, replacements = '') {
    const compileValues = (prev, cur, i, arr) => {
        const isLabel = !(i % 2),
            val = (isLabel ? '- ' + $(cur).text().replace(replacements, '') : `\`${$(cur).text()}\``) ;

        if (!prev) {
            return val + ': ';
        }

        return prev + val + (i !== arr.length - 1 ? (isLabel ? ': ' : '\n') : '');
    };

    return $table.find('td').get().reduce(compileValues, null);
}

// returns command usage as a formatted string
function getUsage() {
    return `\`!overwatch\` \`<cmd>\` \`<battle tag>\` \`[options]\`

\`<cmd>\` can be any of the following:

- \`achievements\`
  Displays acheivements won and needed
- \`average\` (\`avg\`)
  Displays per game averages
- \`stats\`
  Displays overview/summary statistics

\`<battle tag>\` is a Battle.net BattleTag, e.g., \`Player#1234\`

\`[options]\` available for some commands:

- \`competitive-play\` (\`cp\`, \`comp\`, \`competitive\`)
  By default, statistics are from **quick play** matches.
  Specifying any of the above options will grab stats for **competitive play**.`;
}

module.exports = {
    description: 'displays real-time statistics for a given Overwatch player',
    usage: getUsage(),
    process: (bot, msg, args) => {
        const cmd = args[0],
            battleTag = args[1];

        if (!battleTag) {
            bot.sendMessage(msg.channel, `Please supply a BattleTag in the form of \`Player#1234\`.`);
            return;
        }

        if (!BATTLE_TAG_REGEX.test(battleTag)) {
            bot.sendMessage(msg.channel, `**${battleTag}** is not a valid BattleTag.`);
            return;
        }

        request({
            url: OVERWATCH_STATS_BASE_URL + battleTag.replace('#', '-'),
            headers: BATTLE_NET_HEADERS
        }, (err, res, data) => {
            let output;
            debugger;
            const $ = cheerio.load(data),
                $context = $(`#${getContext(args[2])}`),
                $averageTable = getTable($, $context, 'Average'),
                $awardsTable = getTable($, $context, 'Match Awards'),
                $gameTable = getTable($, $context, 'Game'),
                $combatTable = getTable($, $context, 'Combat'),
                $deathsTable = getTable($, $context, 'Deaths'),
                $achievements = $('#achievements-section').find('.achievement-card'),
                hasAchievement = has => (i, el) => $(el).hasClass('m-disabled') !== has,
                name = $('.header-masthead').eq(0).text() || 'Unknown',
                qpLevel = $('.player-level').eq(0).text() || 1,
                compRank = $('.competitive-rank').eq(0).text() || 'Not Ranked',
                gamesPlayed = getTableValue($, $gameTable, 'Games Played') || 0,
                gamesWon = getTableValue($, $gameTable, 'Games Won') || 0,
                gamesLost = gamesPlayed - gamesWon,
                winRate = Math.round(100 * (gamesWon / gamesPlayed)),
                deaths = getTableValue($, $deathsTable, 'Deaths') || 0,
                kills = getTableValue($, $combatTable, 'Eliminations') || 0,
                kdRatio = (kills / deaths).toFixed(2),
                totalAchievements = $achievements.length,
                achievementsWon = $achievements.filter(hasAchievement(true)).length,
                achievementWinRate = Math.round(100 * (achievementsWon / totalAchievements)),
                timePlayed = getTableValue($, $gameTable, 'Time Played'),
                lph = (qpLevel / timePlayed).toFixed(2),
                totalMedals = getTableValue($, $awardsTable, 'Medals') || 0,
                listAverages = () => {
                    const $averageTable = getTable($, $context, 'Average'),
                        mpg = (totalMedals / gamesPlayed).toFixed(2);

                    return getAllTableValues($, $averageTable, ' - Average') +
                        `\n- Medals: \`${mpg}\``;
                },
                listAchievments = () => {
                    const compileAchievements = (prev, cur) => {
                            const val = $(cur).find('.media-card-caption').text();

                            if (!prev) {
                                return '- ' + val;
                            }

                            return prev + '\n- ' + val;
                        },
                        won = $achievements.filter(hasAchievement(true)).get().reduce(compileAchievements, null),
                        needed = $achievements.filter(hasAchievement(false)).get().reduce(compileAchievements, null);

                    return `**Won**\n${won}\n\n**Needed**\n${needed}`;
                };

            switch(cmd) {
                case 'stats':
                    output = `
**${name}** (Level \`${qpLevel}\`, Rank \`${compRank}\`)

- \`${gamesWon}\` wins, \`${gamesLost}\` losses (\`${winRate}%\` win rate)
- \`${kills}\` kills, \`${deaths}\` deaths (\`${kdRatio}\` K/D ratio)
- \`${achievementsWon}/${totalAchievements}\` achievements (\`${achievementWinRate}%\` won)
- \`${lph}\` LPH (Levels Per Hour)
                    `;
                    break;

                case 'avg':
                case 'average':
                    output = `
**${name}, Per Game Averages**
${listAverages()}
                    `;
                    break;

                case 'achievements':
                    output = `
**${name}, Achievements**
${listAchievments()}
                    `;
                    break;

                default:
                    output = `Unrecognized \`!overwatch\` command: \`${cmd}\``
                    break;
            }

            bot.sendMessage(msg.channel, output);
        });
    }
};
