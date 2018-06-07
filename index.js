var Twit = require('twit')
let express = require('express');
let T = new Twit({
    consumer_key:         'zKp2Zpr1V5AJomHLqazcIJP16',
    consumer_secret:      'DhvLm0StrU348LcFIxH1PuC6VZY56eoSI6HbvUPVeSlus8fZVt',
    access_token:         '469590520-Lz6vO06uVgfN1tPkm7fE2ZE6nfy26WgSChCyZYQQ',
    access_token_secret:  'pls5Hx99FBLJFvBWI7sYvSTDEfndOFlyzteAQLAaK91q5',
    timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});
let app = express();

app.get('/', (req, res) => { 
    T.get('search/tweets', { q: 'banana since:2011-07-11', count: 100 }, function(err, data, response) {
        console.log(data)
      })
})

app.listen(3000, () => { 
    console.log('listening on port 3000');
})
