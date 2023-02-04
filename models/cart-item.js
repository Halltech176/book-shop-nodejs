const Sequelize = require("sequelize");

const sequelize = require("../util/database");

const CartItem = sequelize.define("cart-item", {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  quantity: Sequelize.INTEGER,
});
module.exports = CartItem;
