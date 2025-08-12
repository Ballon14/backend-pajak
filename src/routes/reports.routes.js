const express = require("express")
const { authenticateToken } = require("../middlewares/auth")
const controller = require("../controllers/reports.controller")

const router = express.Router()

router.get("/summary", authenticateToken, controller.summary)
router.get("/property", authenticateToken, controller.property)

module.exports = router
