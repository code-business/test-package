const { MongoClient } = require("mongodb");

let cachedDb = null;

const connectToDatabase = (mongo_url, db_name) => {
  if (cachedDb && cachedDb.serverConfig.isConnected()) {
    // => using cached database instance'
    return Promise.resolve(cachedDb);
  }

  return MongoClient.connect(mongo_url, {
    useUnifiedTopology: true,
  }).then((client) => {
    cachedDb = client.db(db_name);
    console.log("Connected to mongo db");
    return cachedDb;
  });
};

module.exports = {
  connectToDatabase: connectToDatabase,
};
