# GreaseBot

## Installation
0. `git clone https://github.com/adion/GreaseBot.git`
0. `npm i`

## Setup
0. [Create a Discord application](https://discordapp.com/developers/applications/me)
0. Create a bot user
    ![Discord's Create a Bot User UI](docs/discord-create-bot.png)
0. [Register your bot user and add it to your guild](https://discordapp.com/developers/docs/topics/oauth2#bots)
0. Copy `config.json.sample` into `config.json` and fill in the variables with your information. These can optionally be provided by environment variables of the same name.

## Running

### PostgreSQL Setup
0. `brew install postgres`
0. `initdb /usr/local/var/postgres`
0. `psql postgres -f setup_db.sql`

0. `postgres -D /usr/local/var/postgres`
0. `npm start`
