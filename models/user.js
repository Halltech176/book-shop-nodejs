const mongodb = require("mongodb");
const { GetDb } = require("../util/database");

const ObjectId = mongodb.ObjectId;

class User {
  constructor(username, email, id, cart) {
    this.email = email;
    this.username = username;
    this.cart = cart;
    this._id = id;
  }
  save() {
    const db = GetDb();
    return db
      .collection("users")
      .insertOne(this)
      .then((result) => {
        return result;
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  addToCart(product) {
    const cartProductIndex = this.cart.items.findIndex((cp) => {
      return cp.productId.toString() === product._id.toString();
    });

    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: new ObjectId(product._id),
        quantity: 1,
      });
    }

    const updatedCart = {
      items: updatedCartItems,
    };
    const db = GetDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: updatedCart } }
      );
  }
  static findById(userId) {
    const db = GetDb();
    return db
      .collection("users")
      .findOne({ _id: new mongodb.ObjectId(userId) });
  }
  getCart() {
    const db = GetDb();
    const productIds = this.cart.items.map((data, index) => {
      return data.productId;
    });

    return db
      .collection("products")
      .find({ _id: { $in: productIds } })
      .toArray()
      .then((products) => {
        return products.map((p) => {
          return {
            ...p,
            quantity: this.cart.items.find((i) => {
              return i.productId.toString() === p._id.toString();
            }).quantity,
          };
        });
      });
  }
  deleteItemFromCart(prodId) {
    const updatedCartItem = this.cart.items.filter((data) => {
      return data.productId.toString() !== prodId.toString();
    });

    const db = GetDb();
    return db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(this._id) },
        { $set: { cart: { items: updatedCartItem } } }
      );
  }
  addOrder() {
    const db = GetDb();
    return this.getCart()
      .then((products) => {
        const order = {
          items: products,
          user: {
            _id: new ObjectId(this._id),
            name: this.name,
          },
        };
        return db.collection("orders").insertOne(order);
      })
      .then((result) => {
        this.cart = { items: [] };
        return db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(this._id) },
            { $set: { cart: { items: [] } } }
          );
      });
  }
  getOrders() {
    const db = GetDb();
    return db
      .collection("orders")
      .find({ "user._id": new Object(this._id) })
      .toArray();
  }
}

module.exports = User;
