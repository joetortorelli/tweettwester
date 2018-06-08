const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const PubSub = require('@google-cloud/pubsub');
const config = require('./config');
var Filter = require('bad-words'),
const url = config.url;
const dbName = config.db;
filter = new Filter();
const pubsub = new PubSub({ 
  projectId: process.env.project_id,
  credentials: {
    "type": process.env.type,
    "project_id": process.env.project_id,
    "private_key_id": process.env.private_key_id,
    "private_key": process.env.private_key.replace(/\\n/g, '\n'),
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
  .get('/', (req, res) => { 
    MongoClient.connect(url, function(err, db) { 
        var dbo = db.db(config.analysisCollection);
        var stream = T.stream('statuses/filter', { track: '@UPS' })
        stream.on('tweet', function (e) {
            console.log('before: ' + e.text);
            e.text = filter.clean(e.text);
            console.log('after: ' + e.text);
            const dataBuffer = Buffer.from(JSON.stringify(e));
            pubsub.topic('hackathon').publisher().publish(dataBuffer)
            .then(messageId => { 
                console.log(`Message ${messageId} published.`);
                dbo.collection(config.tweetCollection).insertOne(e, function(err, res) {
                    console.log('Inserted ' + e.text + ' into database.');
                });
            })
            .catch(err => { console.error('ERROR:', err); }); 
        });
        res.send('You should not be here :)');
    });
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))