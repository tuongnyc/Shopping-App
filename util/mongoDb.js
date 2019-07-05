const mongodb = require('mongodb');

const MongoClient = mongodb.MongoClient;

let db;

const mongoConnect = (callback) => {
    // create a connection.  Return a promise!!
    MongoClient.connect(
        // create on the fly if does not exist!! :-) with shopDB.
        'mongodb+srv://shopapp:shopapp@cluster0-krvu5.mongodb.net/shop?retryWrites=true&w=majority', 
        { useNewUrlParser: true  }
    ).then((client) => {
        console.log('Connected');
        db = client.db();
        callback();
    }).catch(err => {
        console.log('Error: ', err);
        throw err;
    });
}

const getDb = () => {
    if(db) {
        return db;
    }
    throw 'No database found!'
}
module.exports.mongoConnect = mongoConnect;
module.exports.getDb = getDb;
