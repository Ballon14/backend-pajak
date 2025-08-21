const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { validationResult } = require("express-validator")
const User = require("../models/User")
const { jwtSecret } = require("../config/env")

async function register(req, res) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                message: "Validasi gagal",
                errors: errors.array(),
            })
        }
        const { name, email, password } = req.body
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res
                .status(400)
                .json({ success: false, message: "Email sudah terdaftar" })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const user = new User({ name, email, password: hashedPassword })
        await user.save()
        res.status(201).json({
            success: true,
            message: "Registrasi berhasil",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    is_admin: user.is_admin,
                    is_active: user.is_active,
                },
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat registrasi",
        })
    }
}

async function login(req, res) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({
                success: false,
                message: "Validasi gagal",
                errors: errors.array(),
            })
        }
        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Email atau password salah" })
        }
        if (!user.is_active) {
            return res
                .status(401)
                .json({ success: false, message: "Akun Anda nonaktif" })
        }
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res
                .status(401)
                .json({ success: false, message: "Email atau password salah" })
        }
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                name: user.name,
                is_admin: user.is_admin,
            },
            jwtSecret,
            { expiresIn: "7d" }
        )
        res.json({
            success: true,
            message: "Login berhasil",
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    is_active: user.is_active,
                    is_admin: user.is_admin,
                },
                token,
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat login",
        })
    }
}

async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.user_id).select("-password")
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        }
        res.json({ success: true, data: user })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data user",
        })
    }
}

function logout(req, res) {
    res.json({ success: true, message: "Logout berhasil" })
}

async function adminContact(req, res) {
    try {
        const admin = await User.findOne({ is_admin: true, is_active: true })
            .select("_id name email is_admin is_active")
            .sort({ createdAt: 1 })
        if (!admin) {
            return res
                .status(404)
                .json({ success: false, message: "Admin tidak ditemukan" })
        }
        res.json({
            success: true,
            data: { id: admin._id, name: admin.name, email: admin.email },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Gagal mengambil kontak admin",
        })
    }
}

module.exports = { register, login, getMe, logout, adminContact }
