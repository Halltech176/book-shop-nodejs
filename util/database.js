const mongodb = require("mongodb");
const MongoClient = mongodb.MongoClient;

let _db;
const MongoConnect = (callback) => {
  MongoClient.connect("mongodb://127.0.0.1:27017")
    .then((client) => {
      _db = client.db("shop");
      callback();
      console.log("connected...");
    })
    .catch((err) => {
      console.log(err);
      throw err;
    });
};

const GetDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found";
};
exports.MongoConnect = MongoConnect;
exports.GetDb = GetDb;
