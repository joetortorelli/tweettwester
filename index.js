const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const PubSub = require('@google-cloud/pubsub');
const config = require('./config');
const url = config.url;
const dbName = config.db;
const pubsub = new PubSub({ 
  keyFilename: {
    "type": process.env.type,
    "project_id": process.env.project_id,
    "private_key_id": process.env.private_key_id,
    "private_key": process.env.private_key,
    "client_email": process.env.client_email,
    "client_id": process.env.client_id,
    "auth_uri": process.env.auth_uri,
    "token_uri": process.env.token_uri,
    "auth_provider_x509_cert_url": process.env.auth_provider_x509_cert_url,
    "client_x509_cert_url": process.env.client_x509_cert_url
  }
});
const T = config.twit;
const path = require('path');
const PORT = process.env.PORT || 5000

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