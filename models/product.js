const mongodb = require("mongodb");
const { GetDb } = require("../util/database");
const ObjectId = mongodb.ObjectId;

class Product {
  constructor(title, imageUrl, price, description, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id === null ? null : new ObjectId(id);
    this.userId = new ObjectId(userId);
  }
  save() {
    const db = GetDb();
    console.log(this._id);
    let dbOp;
    if (this._id) {
      dbOp = db
        .collection("products")
        .updateOne({ _id: new ObjectId(this._id) }, { $set: this });
    } else dbOp = db.collection("products").insertOne(this);
    return dbOp
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  static FetchAll() {
    const db = GetDb();
    return db
      .collection("products")
      .find()
      .toArray()
      .then((result) => {
        return result;
      })
      .catch((err) => {
        console.log(err);
      });
  }
  static findById(prodId) {
    const db = GetDb();
    return db
      .collection("products")
      .find({ _id: new mongodb.ObjectId(prodId) })
      .next()
      .then((result) => {
        console.log(result);
        return result;
      })
      .catch((err) => console.log(err));
  }
  static deleteById(prodId) {
    const db = GetDb();
    return db
      .collection("products")
      .deleteOne({ _id: new mongodb.ObjectId(prodId) })
      .then((result) => {
        console.log(result);
      })
      .catch((err) => console.log(err));
  }
}

module.exports = Product;
