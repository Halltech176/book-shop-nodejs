const path = require("path");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const csrfProtection = require("csurf");
const flash = require("connect-flash");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);

const errorController = require("./controllers/error");
const User = require("./models/user");

const app = express();
const store = new mongoDBStore({
  uri: "mongodb://127.0.0.1:27017/shop",
  collection: "sessions",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, "images");
  },
  filename: (req, file, cb) => {
    return cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage, fileFilter }).single("image"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: "An undebuggable secret code",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(csrfProtection());
app.use(flash());
app.use((req, res, next) => {
  if (!req.session.user) {
    // return res.redirect("/login");
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch((err) => {
      console.log(err);
    });
});
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);
app.use(errorController.get500);

mongoose
  .connect("mongodb://127.0.0.1:27017/shop")
  .then(() => {
    console.log("connected succefully");
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
