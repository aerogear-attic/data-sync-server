var MongoClient = require('mongodb')
/**
> use pubsub
> db.createCollection('messages', { capped: true, size: 100000 })
> db.messages.insert({})
> exit
 */

async function connect () {
  var client = await MongoClient.connect('mongodb://localhost:27017')
  var db = client.db('pubsub')
  db.collection('messages', function (err, collection) {
    if (err) throw err
    collection.find({}, {
      tailable: true, // the cursor is tailable
      awaitdata: true, //  allow the cursor to wait for data
      numberOfRetries: -1 // the number of times to retry on timeout.
    }).each((err, doc) => {
      if (err) throw err
      // eslint-disable-next-line no-console
      console.info(doc)
    })
  })
}

connect()
