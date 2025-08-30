const express = require("express")
const { body } = require("express-validator")
const { authenticateToken, isAdmin } = require("../middlewares/auth")
const upload = require("../middlewares/upload")
const controller = require("../controllers/admin.controller")

const router = express.Router()

router.get("/users", authenticateToken, isAdmin, controller.listUsers)
router.get("/users/:id", authenticateToken, isAdmin, controller.getUserById)

// Create user (admin)
router.post(
    "/users",
    authenticateToken,
    isAdmin,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("email").isEmail().withMessage("Email harus valid"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password minimal 6 karakter"),
        body("is_admin").optional().isBoolean(),
        body("is_active").optional().isBoolean(),
    ],
    controller.createUser
)

router.put(
    "/users/:id",
    authenticateToken,
    isAdmin,
    [
        body("name")
            .optional()
            .isString()
            .notEmpty()
            .withMessage("Nama harus diisi"),
        body("email").optional().isEmail().withMessage("Email harus valid"),
        body("is_admin")
            .optional()
            .isBoolean()
            .withMessage("is_admin harus boolean"),
        body("is_active")
            .optional()
            .isBoolean()
            .withMessage("is_active harus boolean"),
    ],
    controller.updateUser
)
router.delete("/users/:id", authenticateToken, isAdmin, controller.deleteUser)
router.put(
    "/users/:id/toggle-status",
    authenticateToken,
    isAdmin,
    controller.toggleUserStatus
)

router.get(
    "/tax-records",
    authenticateToken,
    isAdmin,
    controller.listAllTaxRecords
)

// Admin create tax record for any user
router.post(
    "/tax-records",
    authenticateToken,
    isAdmin,
    upload.single("payment_proof"),
    [
        body("user_id").notEmpty().withMessage("User harus dipilih"),
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2000, max: 2035 })
            .withMessage("Tahun harus valid"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah pajak harus valid"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("description").optional().isString(),
        body("notes").optional().isString(),
        body("due_date").optional().isISO8601(),
        body("payment_date").optional().isISO8601(),
    ],
    controller.createTaxRecord
)

router.get(
    "/tax-records/:id",
    authenticateToken,
    isAdmin,
    controller.getTaxRecordById
)
router.put(
    "/tax-records/:id",
    authenticateToken,
    isAdmin,
    upload.single("payment_proof"),
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2000, max: 2030 })
            .withMessage("Tahun harus valid"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah pajak harus valid"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("description").optional().isString(),
        body("notes").optional().isString(),
        body("due_date").optional().isISO8601(),
        body("payment_date").optional().isISO8601(),
    ],
    controller.updateTaxRecord
)
router.get("/statistics", authenticateToken, isAdmin, controller.statistics)

module.exports = router
