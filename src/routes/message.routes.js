const express = require("express")
const { body } = require("express-validator")
const { authenticateToken } = require("../middlewares/auth")
const {
    sendMessage,
    getConversationHistory,
    getConversations,
    markConversationAsSeen,
    deleteConversation,
} = require("../controllers/message.controller")

const router = express.Router()

// Apply authentication to all routes
router.use(authenticateToken)

// Send a message
router.post(
    "/send",
    [
        body("to_user_id").notEmpty().withMessage("ID penerima harus diisi"),
        body("content").notEmpty().withMessage("Pesan harus diisi"),
    ],
    sendMessage
)

// Get conversation history
router.get("/conversation/:with_user_id", getConversationHistory)

// Get conversations list (for admin)
router.get("/conversations", getConversations)

// Mark conversation as seen
router.post("/conversation/:with_user_id/seen", markConversationAsSeen)

// Delete conversation (admin only)
router.delete("/conversation/:with_user_id", deleteConversation)

module.exports = router
