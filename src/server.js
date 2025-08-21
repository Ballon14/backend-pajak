const app = require("./app")
const http = require("http")
const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const { port, corsOrigins, jwtSecret } = require("./config/env")
const { connectToDatabase } = require("./config/db")
const { seedData } = require("./utils/seed")
const Message = require("./models/Message")

async function start() {
    await connectToDatabase()
    await seedData()

    const server = http.createServer(app)
    const io = new Server(server, {
        cors: {
            origin: corsOrigins.includes("*") ? "*" : corsOrigins,
            credentials: true,
        },
    })

    // Track online presence (simple in-memory counter per user)
    const onlineUserIdToCount = new Map()

    // Socket auth using JWT from query or auth header
    io.use((socket, next) => {
        try {
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.split(" ")[1]
            if (!token) return next(new Error("Unauthorized"))
            const payload = jwt.verify(token, jwtSecret)
            socket.user = payload
            socket.join(String(payload.user_id))
            return next()
        } catch (err) {
            return next(new Error("Unauthorized"))
        }
    })

    io.on("connection", (socket) => {
        const userId = String(socket.user.user_id)
        // Update presence
        const prevCount = onlineUserIdToCount.get(userId) || 0
        onlineUserIdToCount.set(userId, prevCount + 1)
        if (prevCount === 0) {
            io.emit("user:online", { user_id: userId, online: true })
        }

        // Hello
        socket.emit("connected", {
            user_id: socket.user.user_id,
            name: socket.user.name,
        })

        // Relay typing indicator
        socket.on("user:typing", ({ to_user_id, is_typing }) => {
            if (!to_user_id) return
            io.to(String(to_user_id)).emit("user:typing", {
                from_user_id: userId,
                is_typing: !!is_typing,
            })
        })

        // Presence query
        socket.on("presence:get", () => {
            socket.emit("presence:list", {
                user_ids: Array.from(onlineUserIdToCount.keys()),
            })
        })

        // Receive a message
        socket.on("message:send", async ({ to_user_id, content }) => {
            if (!to_user_id || !content) return
            const conversation_id = Message.generateConversationId(
                socket.user.user_id,
                to_user_id
            )
            const msg = await Message.create({
                conversation_id,
                sender_id: socket.user.user_id,
                receiver_id: to_user_id,
                content,
            })
            io.to(String(to_user_id)).emit("message:new", {
                _id: msg._id,
                conversation_id,
                sender_id: String(msg.sender_id),
                receiver_id: String(msg.receiver_id),
                content: msg.content,
                createdAt: msg.createdAt,
            })
            // Echo to sender as well (to update their UI instantly)
            socket.emit("message:new", {
                _id: msg._id,
                conversation_id,
                sender_id: String(msg.sender_id),
                receiver_id: String(msg.receiver_id),
                content: msg.content,
                createdAt: msg.createdAt,
            })
        })

        // Delete entire conversation (admin only)
        socket.on("conversation:delete", async ({ with_user_id }, cb) => {
            try {
                if (!with_user_id)
                    return (
                        typeof cb === "function" &&
                        cb({
                            success: false,
                            message: "with_user_id diperlukan",
                        })
                    )
                if (!socket.user?.is_admin)
                    return (
                        typeof cb === "function" &&
                        cb({ success: false, message: "Akses ditolak" })
                    )
                const conversation_id = Message.generateConversationId(
                    socket.user.user_id,
                    with_user_id
                )
                await Message.deleteMany({ conversation_id })
                io.to(String(with_user_id)).emit("conversation:deleted", {
                    conversation_id,
                })
                socket.emit("conversation:deleted", { conversation_id })
                if (typeof cb === "function") cb({ success: true })
            } catch (e) {
                if (typeof cb === "function")
                    cb({
                        success: false,
                        message: "Gagal menghapus percakapan",
                    })
            }
        })

        // Mark conversation as seen
        socket.on("conversation:seen", async ({ with_user_id }) => {
            if (!with_user_id) return
            const conversation_id = Message.generateConversationId(
                socket.user.user_id,
                with_user_id
            )
            await Message.updateMany(
                {
                    conversation_id,
                    receiver_id: socket.user.user_id,
                    seen_at: null,
                },
                { $set: { seen_at: new Date() } }
            )
        })

        // Fetch history
        socket.on(
            "conversation:history",
            async ({ with_user_id, limit = 50 }) => {
                if (!with_user_id) return
                const conversation_id = Message.generateConversationId(
                    socket.user.user_id,
                    with_user_id
                )
                const messages = await Message.find({ conversation_id })
                    .sort({ createdAt: -1 })
                    .limit(Math.max(1, Math.min(200, limit)))
                    .lean()
                socket.emit("conversation:history:result", {
                    with_user_id,
                    messages: messages.reverse(),
                })
            }
        )

        socket.on("disconnect", () => {
            const current = onlineUserIdToCount.get(userId) || 0
            const next = Math.max(0, current - 1)
            if (next === 0) {
                onlineUserIdToCount.delete(userId)
                io.emit("user:online", { user_id: userId, online: false })
            } else {
                onlineUserIdToCount.set(userId, next)
            }
        })
    })

    server.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`)
        console.log(`📊 API available at http://localhost:${port}/api`)
        console.log(`💬 WebSocket at http://localhost:${port}`)
    })
}

start().catch((err) => {
    console.error("Failed to start server:", err)
    process.exit(1)
})
