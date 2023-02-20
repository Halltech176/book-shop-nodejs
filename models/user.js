const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, "name is required"],
    trim: true,
    maxLenght: [40, "a name must have atmost 40 characters"],
    minLength: [3, "A name must have atlest 3 characters"],
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  resetToken: String,
  resetTokenExpire: Date,
  cart: {
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

UserSchema.methods.addToCart = function (product) {
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
      productId: product._id,
      quantity: 1,
    });
  }

  const updatedCart = {
    items: updatedCartItems,
  };
  this.cart = updatedCart;
  this.save();
};

UserSchema.methods.deleteItemFromCart = function (prodId) {
  const updatedCartItem = this.cart.items.filter((data) => {
    return data._id.toString() !== prodId.toString();
  });
  this.cart.items = updatedCartItem;

  return this.save();
};

UserSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

UserSchema.statics.encryptPassword = function (password) {
  return bcrypt
    .hash(password, 12)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      console.log(err);
    });
};
UserSchema.methods.decryptPassword = function (
  userPassword,
  encryptedPassword
) {
  return bcrypt
    .compare(userPassword, encryptedPassword)
    .then((result) => {
      console.log("logging password");

      return result;
    })
    .catch((err) => {
      console.log(err);
    });
};
module.exports = mongoose.model("User", UserSchema);
