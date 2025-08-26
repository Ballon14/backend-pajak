const Message = require("../models/Message")
const User = require("../models/User")

// Send a message
const sendMessage = async (req, res) => {
    try {
        const { to_user_id, content } = req.body
        const sender_id = req.user.user_id

        if (!to_user_id || !content) {
            return res.status(400).json({
                success: false,
                message: "to_user_id dan content harus diisi",
            })
        }

        // Check if receiver exists
        const receiver = await User.findById(to_user_id)
        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: "Penerima tidak ditemukan",
            })
        }

        const conversation_id = Message.generateConversationId(
            sender_id,
            to_user_id
        )

        const message = await Message.create({
            conversation_id,
            sender_id,
            receiver_id: to_user_id,
            content: content.trim(),
        })

        // Populate sender info
        await message.populate("sender_id", "name email")

        res.status(201).json({
            success: true,
            data: {
                _id: message._id,
                conversation_id: message.conversation_id,
                sender_id: String(message.sender_id._id),
                receiver_id: String(message.receiver_id),
                content: message.content,
                createdAt: message.createdAt,
                sender: {
                    name: message.sender_id.name,
                    email: message.sender_id.email,
                },
            },
        })
    } catch (error) {
        console.error("Error sending message:", error)
        res.status(500).json({
            success: false,
            message: "Gagal mengirim pesan",
        })
    }
}

// Get conversation history
const getConversationHistory = async (req, res) => {
    try {
        const { with_user_id } = req.params
        const { limit = 50, page = 1 } = req.query
        const user_id = req.user.user_id

        if (!with_user_id) {
            return res.status(400).json({
                success: false,
                message: "with_user_id harus diisi",
            })
        }

        const conversation_id = Message.generateConversationId(
            user_id,
            with_user_id
        )

        const skip = (parseInt(page) - 1) * parseInt(limit)
        const messages = await Message.find({ conversation_id })
            .populate("sender_id", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Math.max(1, Math.min(200, parseInt(limit))))
            .lean()

        // Mark messages as seen
        await Message.updateMany(
            {
                conversation_id,
                receiver_id: user_id,
                seen_at: null,
            },
            { seen_at: new Date() }
        )

        // Format messages
        const formattedMessages = messages.reverse().map((msg) => ({
            _id: msg._id,
            conversation_id: msg.conversation_id,
            sender_id: String(msg.sender_id._id),
            receiver_id: String(msg.receiver_id),
            content: msg.content,
            createdAt: msg.createdAt,
            seen_at: msg.seen_at,
            sender: {
                name: msg.sender_id.name,
                email: msg.sender_id.email,
            },
        }))

        res.json({
            success: true,
            data: {
                with_user_id,
                messages: formattedMessages,
            },
        })
    } catch (error) {
        console.error("Error getting conversation history:", error)
        res.status(500).json({
            success: false,
            message: "Gagal mengambil riwayat percakapan",
        })
    }
}

// Get conversations list (for admin)
const getConversations = async (req, res) => {
    try {
        const user_id = req.user.user_id
        const { limit = 20, page = 1 } = req.query

        // Get unique conversations for this user
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender_id: user_id }, { receiver_id: user_id }],
                },
            },
            {
                $group: {
                    _id: "$conversation_id",
                    lastMessage: { $last: "$$ROOT" },
                    messageCount: { $sum: 1 },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiver_id", user_id] },
                                        { $eq: ["$seen_at", null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            {
                $sort: { "lastMessage.createdAt": -1 },
            },
            {
                $skip: (parseInt(page) - 1) * parseInt(limit),
            },
            {
                $limit: parseInt(limit),
            },
        ])

        // Get user details for each conversation
        const conversationsWithUsers = await Promise.all(
            conversations.map(async (conv) => {
                const [user1Id, user2Id] = conv._id.split(":")
                const otherUserId =
                    user1Id === String(user_id) ? user2Id : user1Id

                const otherUser = await User.findById(otherUserId).select(
                    "name email is_admin"
                )

                return {
                    conversation_id: conv._id,
                    other_user: {
                        _id: otherUser._id,
                        name: otherUser.name,
                        email: otherUser.email,
                        is_admin: otherUser.is_admin,
                    },
                    last_message: {
                        _id: conv.lastMessage._id,
                        content: conv.lastMessage.content,
                        sender_id: String(conv.lastMessage.sender_id),
                        createdAt: conv.lastMessage.createdAt,
                    },
                    message_count: conv.messageCount,
                    unread_count: conv.unreadCount,
                }
            })
        )

        res.json({
            success: true,
            data: conversationsWithUsers,
        })
    } catch (error) {
        console.error("Error getting conversations:", error)
        res.status(500).json({
            success: false,
            message: "Gagal mengambil daftar percakapan",
        })
    }
}

// Mark conversation as seen
const markConversationAsSeen = async (req, res) => {
    try {
        const { with_user_id } = req.params
        const user_id = req.user.user_id

        if (!with_user_id) {
            return res.status(400).json({
                success: false,
                message: "with_user_id harus diisi",
            })
        }

        const conversation_id = Message.generateConversationId(
            user_id,
            with_user_id
        )

        await Message.updateMany(
            {
                conversation_id,
                receiver_id: user_id,
                seen_at: null,
            },
            { seen_at: new Date() }
        )

        res.json({
            success: true,
            message: "Percakapan ditandai sebagai telah dibaca",
        })
    } catch (error) {
        console.error("Error marking conversation as seen:", error)
        res.status(500).json({
            success: false,
            message: "Gagal menandai percakapan",
        })
    }
}

// Delete conversation (admin only)
const deleteConversation = async (req, res) => {
    try {
        const { with_user_id } = req.params
        const user_id = req.user.user_id

        if (!req.user.is_admin) {
            return res.status(403).json({
                success: false,
                message: "Hanya admin yang dapat menghapus percakapan",
            })
        }

        if (!with_user_id) {
            return res.status(400).json({
                success: false,
                message: "with_user_id harus diisi",
            })
        }

        const conversation_id = Message.generateConversationId(
            user_id,
            with_user_id
        )

        await Message.deleteMany({ conversation_id })

        res.json({
            success: true,
            message: "Percakapan berhasil dihapus",
        })
    } catch (error) {
        console.error("Error deleting conversation:", error)
        res.status(500).json({
            success: false,
            message: "Gagal menghapus percakapan",
        })
    }
}

module.exports = {
    sendMessage,
    getConversationHistory,
    getConversations,
    markConversationAsSeen,
    deleteConversation,
}
