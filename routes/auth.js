const express = require("express");

const router = express.Router();
const authController = require("../controllers/auth");

router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);
router.post("/logout", authController.postLogout);
router.get("/signup", authController.getSignUp);
router.post("/signup", authController.postSignUp);
router.get("/forgot-password", authController.getReset);
router.post("/reset-password", authController.postReset);
router.get("/reset-password/:token", authController.getPasswordReset);
router.post("/new-password", authController.postNewPassword);

module.exports = router;
