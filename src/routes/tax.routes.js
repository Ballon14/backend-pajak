const express = require("express")
const { body } = require("express-validator")
const { authenticateToken } = require("../middlewares/auth")
const upload = require("../middlewares/upload")
const controller = require("../controllers/tax.controller")

const router = express.Router()

router.get("/", authenticateToken, controller.list)
router.get("/statistics", authenticateToken, controller.statistics)
router.get("/outstanding", authenticateToken, controller.outstanding)
router.get("/year/:year", authenticateToken, controller.byYear)
router.get("/check-year", authenticateToken, controller.checkYear)
router.post("/auto-create", authenticateToken, controller.autoCreate)

// Route for creating tax record with file upload
router.post(
    "/",
    authenticateToken,
    upload.single("payment_proof"),
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .customSanitizer((value) => {
                if (value === "" || value === null || value === undefined)
                    return value
                return parseInt(value)
            })
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .customSanitizer((value) => {
                if (value === "" || value === null || value === undefined)
                    return value
                return parseFloat(value)
            })
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .optional()
            .customSanitizer((value) => {
                if (!value) return value
                // If it's already in YYYY-MM-DD format, return as is
                if (
                    typeof value === "string" &&
                    value.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                    return value
                }
                // Try to parse and format
                try {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return value
                    return date.toISOString().split("T")[0]
                } catch {
                    return value
                }
            })
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
        body("payment_date")
            .optional()
            .customSanitizer((value) => {
                if (!value) return value
                // If it's already in YYYY-MM-DD format, return as is
                if (
                    typeof value === "string" &&
                    value.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                    return value
                }
                // Try to parse and format
                try {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return value
                    return date.toISOString().split("T")[0]
                } catch {
                    return value
                }
            })
            .isISO8601()
            .withMessage("Tanggal pembayaran tidak valid"),
    ],
    controller.create
)

router.get("/:id", authenticateToken, controller.getById)

// Route for updating tax record with file upload
router.put(
    "/:id",
    authenticateToken,
    upload.single("payment_proof"),
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .customSanitizer((value) => {
                if (value === "" || value === null || value === undefined)
                    return value
                return parseInt(value)
            })
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .customSanitizer((value) => {
                if (value === "" || value === null || value === undefined)
                    return value
                return parseFloat(value)
            })
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .optional()
            .customSanitizer((value) => {
                if (!value) return value
                // If it's already in YYYY-MM-DD format, return as is
                if (
                    typeof value === "string" &&
                    value.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                    return value
                }
                // Try to parse and format
                try {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return value
                    return date.toISOString().split("T")[0]
                } catch {
                    return value
                }
            })
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
        body("payment_date")
            .optional()
            .customSanitizer((value) => {
                if (!value) return value
                // If it's already in YYYY-MM-DD format, return as is
                if (
                    typeof value === "string" &&
                    value.match(/^\d{4}-\d{2}-\d{2}$/)
                ) {
                    return value
                }
                // Try to parse and format
                try {
                    const date = new Date(value)
                    if (isNaN(date.getTime())) return value
                    return date.toISOString().split("T")[0]
                } catch {
                    return value
                }
            })
            .isISO8601()
            .withMessage("Tanggal pembayaran tidak valid"),
    ],
    controller.update
)

// Route for uploading payment proof only
router.post(
    "/:id/payment-proof",
    authenticateToken,
    upload.single("payment_proof"),
    controller.uploadPaymentProof
)

router.delete("/:id", authenticateToken, controller.remove)

router.get("/property", authenticateToken, controller.propertyReport)

module.exports = router
