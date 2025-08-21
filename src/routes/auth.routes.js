const express = require("express")
const { body } = require("express-validator")
const {
    register,
    login,
    getMe,
    logout,
    adminContact,
} = require("../controllers/auth.controller")
const { authenticateToken } = require("../middlewares/auth")

const router = express.Router()

router.post(
    "/register",
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("email").isEmail().withMessage("Email tidak valid"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password minimal 6 karakter"),
    ],
    register
)

router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Email tidak valid"),
        body("password").notEmpty().withMessage("Password harus diisi"),
    ],
    login
)

router.post("/logout", authenticateToken, logout)
router.get("/user", authenticateToken, getMe)
router.get("/admin-contact", authenticateToken, adminContact)

module.exports = router
