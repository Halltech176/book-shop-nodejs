const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const User = require("../models/user");

const Transporter = nodemailer.createTransport({
  // service: "SendGrid",
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "a67c9d6125d995",
    pass: "21fa94eb99b324",
  },
});

exports.getLogin = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/login", {
    pageTitle: "Login Page",
    path: "/login",
    errorMessage: message,
  });
};
exports.postLogin = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        user
          .decryptPassword(password, user.password)
          .then((result) => {
            if (result) {
              req.session.isLoggedIn = true;
              req.session.user = user;
              req.session.save((err) => {
                return res.redirect("/");
                console.log(err);
              });
            } else {
              req.flash("error", "please provide a valid password");
              return res.redirect("/login");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        req.flash("error", "please provide a valid email");
        return res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
    console.log(err);
  });
  //   res.setHeader("Set-Cookie", "loggedIn=true; HttpOnly");
};
exports.getSignUp = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/signup", {
    pageTitle: "Sign Page",
    path: "/signup",
    isAuthenticated: false,
    errorMessage: message,
  });
};
exports.postSignUp = (req, res, next) => {
  const { name, password, email } = req.body;

  User.findOne({ email }).then((result) => {
    if (result) {
      req.flash("error", "credential already exist");
      return res.redirect("/signup");
    }
    User.encryptPassword(password)
      .then((result) => {
        const user = new User({
          name,
          password: result,
          email,
          cart: { items: [] },
        });

        // return new Promise(() => {});
        return user.save();
      })
      .then(() => {
        res.redirect("/login");
        return Transporter.sendMail(
          {
            from: "devhalltech@gmail.com",
            to: email,
            subject: "SignUp Sucecsfully",
            text: "Welcoming youn here bosses",
            html: "<h1> Verify your email </h1>",
          },
          (err, info) => {
            if (err) {
              return console.log("error found", err);
            } else {
              console.log(info);
            }
          }
        );
      })
      .catch((err) => {
        console.log("error", err);
        const message = Object.entries(err.errors)[0][1].message;
        res.render("auth/signup", {
          pageTitle: "Sign Page",
          path: "/signup",
          isAuthenticated: false,
          errorMessage: message,
        });
      });
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash("error");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("auth/reset", {
    pageTitle: "forgot-password",
    path: "/forgotten-password",
    isAuthenticated: false,
    errorMessage: message,
  });
};

exports.postReset = (req, res, next) => {
  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect("/login");
    } else {
      const token = buffer.toString("hex");
      User.findOne({ email: req.body.email })
        .then((user) => {
          if (!user) {
            req.flash("error", "No account with this email is found");
            return res.redirect("/forgot-password");
          }
          user.resetToken = token;
          user.resetTokenExpire = new Date(Date.now(360000)).toString();
          return user.save();
        })
        .then((result) => {
          res.redirect("/");
          return Transporter.sendMail(
            {
              from: "devhalltech@gmail.com",
              to: req.body.email,
              subject: "Password Reset Verification",
              // text: "Welcoming youn here ",
              html: `
              <p>Click the the <a href=${url}/${token} >Link </a> to reset your password </p>
              `,
            },
            (err, info) => {
              if (err) {
                return console.log("error found", err);
              } else {
                console.log(info);
              }
            }
          );
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
};

exports.getPasswordReset = (req, res, next) => {
  const token = req.params.token;

  User.findOne({
    resetToken: token,
    // resetTokenExpire: { $gt: new Date(Date.now()) },
  }).then((user) => {
    console.log(user);
    let message = req.flash("error");
    if (message.length > 0) {
      message = message[0];
    } else {
      message = null;
    }
    res.render("auth/newPassword", {
      pageTitle: "Reset Password",
      path: "/new-password",
      errorMessage: message,
      userId: user._id,
      resetToken: token,
    });
  });
};

exports.postNewPassword = (req, res, next) => {
  const { userId, resetToken, password } = req.body;
  console.log(req.body);
  User.findOne({
    _id: userId.toString(),
    resetToken,
    // resetTokenExpire: { $gt: Date.now() },
  })
    .then((user) => {
      User.encryptPassword(password)
        .then((result) => {
          user.password = result;
          user.resetToken = undefined;
          user.resetTokenExpire = undefined;
          return user.save();
        })
        .then(() => {
          return res.redirect("/login");
        });
    })
    .catch((err) => {
      console.log(err);
    });
};
