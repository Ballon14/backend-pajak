const express = require("express")
const { body } = require("express-validator")
const { authenticateToken } = require("../middlewares/auth")
const controller = require("../controllers/tax.controller")

const router = express.Router()

router.get("/", authenticateToken, controller.list)
router.get("/statistics", authenticateToken, controller.statistics)
router.get("/outstanding", authenticateToken, controller.outstanding)
router.get("/year/:year", authenticateToken, controller.byYear)
router.get("/check-year", authenticateToken, controller.checkYear)
router.post("/auto-create", authenticateToken, controller.autoCreate)

router.post(
    "/",
    authenticateToken,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
    ],
    controller.create
)

router.get("/:id", authenticateToken, controller.getById)

router.put(
    "/:id",
    authenticateToken,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
    ],
    controller.update
)

router.delete("/:id", authenticateToken, controller.remove)

router.get("/property", authenticateToken, controller.propertyReport)

module.exports = router
