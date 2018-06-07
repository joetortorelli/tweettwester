const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000
let T = new Twit({
  consumer_key:         'zKp2Zpr1V5AJomHLqazcIJP16',
  consumer_secret:      'DhvLm0StrU348LcFIxH1PuC6VZY56eoSI6HbvUPVeSlus8fZVt',
  access_token:         '469590520-Lz6vO06uVgfN1tPkm7fE2ZE6nfy26WgSChCyZYQQ',
  access_token_secret:  'pls5Hx99FBLJFvBWI7sYvSTDEfndOFlyzteAQLAaK91q5',
  timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
});
express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => { 
    var stream = T.stream('statuses/filter', { track: 'mango' })
    T.get('search/tweets', { q: 'banana since:2011-07-11', count: 10 }, function(err, data, response) {
     res.send(data);
    })
    stream.on('tweet', function (tweet) {
      console.log(tweet)
    })
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))
