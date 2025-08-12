const jwt = require("jsonwebtoken")
const { jwtSecret } = require("../config/env")

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Token tidak ditemukan" })
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            return res
                .status(401)
                .json({ success: false, message: "Token tidak valid" })
        }
        req.user = user
        next()
    })
}

function isAdmin(req, res, next) {
    if (!req.user?.is_admin) {
        return res
            .status(403)
            .json({ success: false, message: "Akses ditolak" })
    }
    next()
}

module.exports = { authenticateToken, isAdmin }
