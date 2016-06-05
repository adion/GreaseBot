'use strict';

let config = process.env;

try {
    config = Object.assign(config, require('./config.json'));
} catch (e) {
    console.log('config.json missing!');
}

module.exports = config;
