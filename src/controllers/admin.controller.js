const { validationResult } = require("express-validator")
const User = require("../models/User")
const TaxRecord = require("../models/TaxRecord")

async function listUsers(req, res) {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
        res.json({ success: true, data: { data: users } })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data users",
        })
    }
}

async function getUserById(req, res) {
    try {
        const user = await User.findById(req.params.id).select("-password")
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        res.json({ success: true, data: user })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data user",
        })
    }
}

async function updateUser(req, res) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
        }
        const { name, email, is_admin, is_active } = req.body
        if (email) {
            const existing = await User.findOne({
                email,
                _id: { $ne: req.params.id },
            })
            if (existing) {
                return res
                    .status(409)
                    .json({
                        success: false,
                        message: "Email sudah digunakan oleh user lain",
                    })
            }
        }
        const updateFields = {}
        if (typeof name !== "undefined") updateFields.name = name
        if (typeof email !== "undefined") updateFields.email = email
        if (typeof is_admin !== "undefined") updateFields.is_admin = is_admin
        if (typeof is_active !== "undefined") updateFields.is_active = is_active
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        ).select("-password")
        if (!updatedUser)
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        res.json({
            success: true,
            message: "User berhasil diperbarui",
            data: updatedUser,
        })
    } catch (error) {
        if (error && error.code === 11000) {
            return res
                .status(409)
                .json({
                    success: false,
                    message: "Email sudah digunakan oleh user lain",
                })
        }
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memperbarui user",
        })
    }
}

async function deleteUser(req, res) {
    try {
        const deleted = await User.findByIdAndDelete(req.params.id)
        if (!deleted)
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        res.json({ success: true, message: "User berhasil dihapus" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghapus user",
        })
    }
}

async function toggleUserStatus(req, res) {
    try {
        const user = await User.findById(req.params.id)
        if (!user)
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        user.is_active = !user.is_active
        await user.save()
        const sanitized = user.toObject()
        delete sanitized.password
        res.json({
            success: true,
            message: `Status user berhasil diubah menjadi ${
                sanitized.is_active ? "Active" : "Inactive"
            }`,
            data: sanitized,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengubah status user",
        })
    }
}

async function listAllTaxRecords(req, res) {
    try {
        const taxRecords = await TaxRecord.find()
            .populate("user_id", "name email")
            .sort({ createdAt: -1 })
        const transformedRecords = taxRecords.map((record) => ({
            id: record._id,
            name: record.name,
            address: record.address,
            tax_type: record.tax_type,
            spt_number: record.spt_number,
            year: record.year,
            total: record.amount,
            amount: record.amount,
            description: record.description,
            status: record.status,
            due_date: record.due_date,
            payment_date: record.payment_date,
            notes: record.notes,
            user: record.user_id
                ? { name: record.user_id.name, email: record.user_id.email }
                : null,
            created_at: record.createdAt,
            updated_at: record.updatedAt,
        }))
        res.json({ success: true, data: { data: transformedRecords } })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data pajak",
        })
    }
}

async function getTaxRecordById(req, res) {
    try {
        const taxRecord = await TaxRecord.findById(req.params.id).populate(
            "user_id",
            "name email"
        )
        if (!taxRecord)
            return res
                .status(404)
                .json({ success: false, message: "Data pajak tidak ditemukan" })
        const transformedRecord = {
            id: taxRecord._id,
            name: taxRecord.name,
            address: taxRecord.address,
            tax_type: taxRecord.tax_type,
            spt_number: taxRecord.spt_number,
            year: taxRecord.year,
            total: taxRecord.amount,
            amount: taxRecord.amount,
            description: taxRecord.description,
            status: taxRecord.status,
            due_date: taxRecord.due_date,
            payment_date: taxRecord.payment_date,
            notes: taxRecord.notes,
            user: taxRecord.user_id
                ? {
                      name: taxRecord.user_id.name,
                      email: taxRecord.user_id.email,
                  }
                : null,
            created_at: taxRecord.createdAt,
            updated_at: taxRecord.updatedAt,
        }
        res.json({ success: true, data: transformedRecord })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data pajak",
        })
    }
}

async function updateTaxRecord(req, res) {
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res
                .status(422)
                .json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
        }
        const taxRecord = await TaxRecord.findById(req.params.id)
        if (!taxRecord)
            return res
                .status(404)
                .json({ success: false, message: "Data pajak tidak ditemukan" })
        const {
            name,
            address,
            tax_type,
            spt_number,
            year,
            amount,
            description,
            status,
            due_date,
            payment_date,
            notes,
        } = req.body
        taxRecord.name = name
        taxRecord.address = address
        taxRecord.tax_type = tax_type
        taxRecord.spt_number = spt_number
        taxRecord.year = year
        taxRecord.amount = amount
        taxRecord.description = description || ""
        taxRecord.status = status
        taxRecord.due_date = due_date ? new Date(due_date) : null
        taxRecord.payment_date = payment_date ? new Date(payment_date) : null
        taxRecord.notes = notes || ""
        await taxRecord.save()
        res.json({
            success: true,
            message: "Data pajak berhasil diperbarui",
            data: {
                id: taxRecord._id,
                name: taxRecord.name,
                address: taxRecord.address,
                tax_type: taxRecord.tax_type,
                spt_number: taxRecord.spt_number,
                year: taxRecord.year,
                amount: taxRecord.amount,
                description: taxRecord.description,
                status: taxRecord.status,
                due_date: taxRecord.due_date,
                payment_date: taxRecord.payment_date,
                notes: taxRecord.notes,
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memperbarui data pajak",
        })
    }
}

async function statistics(req, res) {
    try {
        const totalUsers = await User.countDocuments()
        const activeUsers = await User.countDocuments({ is_active: true })
        const adminUsers = await User.countDocuments({ is_admin: true })
        const allTaxRecords = await TaxRecord.find()
        const totalRecords = allTaxRecords.length
        const lunas = allTaxRecords.filter((r) => r.status === "lunas").length
        const belumLunas = allTaxRecords.filter(
            (r) => r.status === "belum_lunas"
        ).length
        const proses = allTaxRecords.filter((r) => r.status === "proses").length
        const totalTax = allTaxRecords.reduce((s, r) => s + r.amount, 0)
        const paidTax = allTaxRecords
            .filter((r) => r.status === "lunas")
            .reduce((s, r) => s + r.amount, 0)
        const unpaidTax = totalTax - paidTax
        res.json({
            success: true,
            data: {
                total_users: totalUsers,
                active_users: activeUsers,
                admin_users: adminUsers,
                total_records: totalRecords,
                lunas,
                belum_lunas: belumLunas,
                proses,
                total_tax: totalTax,
                paid_tax: paidTax,
                unpaid_tax: unpaidTax,
                outstanding_records: belumLunas + proses,
                outstanding_amount: unpaidTax,
            },
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil statistik admin",
        })
    }
}

module.exports = {
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus,
    listAllTaxRecords,
    getTaxRecordById,
    updateTaxRecord,
    statistics,
}
