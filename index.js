const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const PubSub = require('@google-cloud/pubsub');
const config = require('./config');
const url = config.url;
const dbName = config.db;
const pubsub = new PubSub();
const T = config.twit;

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => { 
    console.log('test1');
    MongoClient.connect(url, function(err, db) { 
        var dbo = db.db(dbName);
        var stream = T.stream('statuses/filter', { track: '@UPS' })
        stream.on('tweet', function (e) {
            console.log('storing and publishing the tweets: ' + e.id + ' : ' + e.text);
            const dataBuffer = Buffer.from(JSON.stringify(e));
            pubsub.topic('hackathon').publisher().publish(dataBuffer)
            .then(messageId => { 
                console.log(`Message ${messageId} published.`);
                dbo.collection("savedTweets").insertOne(e, function(err, res) {
                    console.log("1 document inserted: " + e.id + " - " + e.text);
                });
            })
            .catch(err => { console.error('ERROR:', err); }); 
        });
        res.send('ahouy matey');
    });
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))