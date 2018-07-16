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
express().get('/' + process.env.hidden, (req, res) => { 
    MongoClient.connect(process.env.url, function(err, db) { 
        var dbo = db.db(process.env.db);
        var stream = T.stream('statuses/filter', { track: '@UPS' })
        stream.on('tweet', function (e) {
            dbo.collection(process.env.tweetCollection).findOne({ "text" : e.id }, (err, doIExist) => {
                if (doIExist) {
                    let originalText = e.text;
                    e.text = filter.clean(e.text);
                    const dataBuffer = Buffer.from(JSON.stringify(e));
                    pubsub.topic('hackathon').publisher().publish(dataBuffer)
                    .then(messageId => { 
                        if (filter.isProfane(originalText)) { 
                            dbo.collection('threats').insertOne(e, function(err, res) {
                                fs.appendFile('logs.txt', e.text + '\r\n', function (err) {
                                    if (err) throw err;
                                    console.log('Saved!');
                                });
                                dbo.collection(process.env.tweetCollection).insertOne(e, function(err, res) {
                                    console.log('Inserted ' + e.text + ' into database.');
                                    fs.appendFile('logs.txt', e.text + '\r\n', function (err) {
                                        if (err) throw err;
                                        console.log('Saved!');
                                    });
                                });
                            });
                        } else { 
                            dbo.collection(process.env.tweetCollection).insertOne(e, function(err, res) {
                                fs.appendFile('logs.txt', e.text + '\r\n', function (err) {
                                    if (err) throw err;
                                    console.log('Saved!');
                                });
                                console.log('Inserted ' + e.text + ' into database.');
                            });
                        }
                    })
                    .catch(err => { console.error('ERROR:', err); }); 
                } else { console.log(e.id + ' has already been added to the db bro'); }
            });
        });
        res.send('You should not be her4e :)');
    });
})
.get('/logs', (req, res) => { 
    // fs.readFile('./logs.txt', "utf8", (err, data) => {
    //     console.log(data);
    //     console.log(err);

    //     res.send('meep: ' + data);
    //  });
    MongoClient.connect(process.env.url, function(err, db) { 
        var dbo = db.db(process.env.db);
        dbo.collection(process.env.tweetCollection).findOne({ "text" : "@UPS you guys are the greatest1234"},
        function(err, result) {
            console.log('wut am i');
            console.log(result);
            res.send(JSON.stringify(result));
        });
    });
})
.listen(PORT, () => { console.log(`Listening on ${ PORT }`) });