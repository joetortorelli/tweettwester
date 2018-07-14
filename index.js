const express = require('express');
var os = require("os");
const MongoClient = require('mongodb').MongoClient;
const PubSub = require('@google-cloud/pubsub');
var fs = require('fs');
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
var Filter = require('bad-words'),
filter = new Filter();
filter.removeWords('hello');
const Twit = require('twit');
const T = new Twit({
    consumer_key:         process.env.consumer_key,
    consumer_secret:      process.env.consumer_secret,
    access_token:         process.env.access_token,
    access_token_secret:  process.env.access_token_secret,
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});
const path = require('path');
const PORT = process.env.PORT || 5000
express()
  .get('/' + process.env.hidden, (req, res) => { 
    MongoClient.connect(process.env.url, function(err, db) { 
        var dbo = db.db(process.env.db);
        var stream = T.stream('statuses/filter', { track: '@UPS' })
        stream.on('tweet', function (e) {
            let originalText = e.text;
            e.text = filter.clean(e.text);
            console.log(e.text);
            const dataBuffer = Buffer.from(JSON.stringify(e));
            pubsub.topic('hackathon').publisher().publish(dataBuffer)
            .then(messageId => { 
                if (filter.isProfane(originalText)) { 
                    dbo.collection('threats').insertOne(e, function(err, res) {
                        logThisBih("Inserting (Threat): " + e.text);
                        dbo.collection(process.env.tweetCollection).insertOne(e, function(err, res) {
                            console.log('Inserted ' + e.text + ' into database.');
                            logThisBih("Inserting: " + e.text);
                        });
                    });
                } else { 
                    dbo.collection(process.env.tweetCollection).insertOne(e, function(err, res) {
                        logThisBih("Inserting: " + e.text);
                        console.log('Inserted ' + e.text + ' into database.');
                    });
                }
            })
            .catch(err => { console.error('ERROR:', err); }); 
        });
        res.send('You should not be her4e :)');
    });
  })
  express().get('/logs', (req, res) => { 
    fs.readFile('./logs.txt', data => {
        console.log(data);
        res.send(data);
     });
  })
  .listen(PORT, () => { console.log(`Listening on ${ PORT }`) });

var logThisBih = (text) => {
  fs.open('./logs.txt', 'a', 666, function( e, id ) {
   fs.write( id, text + os.EOL, null, 'utf8', function(){
    fs.close(id, function(){
     console.log('file is updated');
    });
   });
  });
 }