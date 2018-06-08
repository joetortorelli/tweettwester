let Twit = require('twit');

let config = {} 

config.url = process.env.url;
config.db = process.env.db;
config.tweetCollection = process.env.tweetCollection;
config.analysisCollection = process.env.db;

config.twit = new Twit({
    consumer_key:         process.env.consumer_key,
    consumer_secret:      process.env.consumer_secret,
    access_token:         process.env.access_token,
    access_token_secret:  process.env.access_token_secret,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});

module.exports = config;