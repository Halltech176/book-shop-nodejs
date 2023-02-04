const Sequelize = require("sequelize");

const sequelize = new Sequelize("node-course", "root", "@Machine101", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;
// mongodb+srv://halltech:<password>@cluster0.siy97ta.mongodb.net/test
