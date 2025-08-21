const mongoose = require("mongoose")

const messageSchema = new mongoose.Schema(
    {
        conversation_id: { type: String, index: true },
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        receiver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        content: { type: String, required: true },
        seen_at: { type: Date, default: null },
    },
    { timestamps: true }
)

// Generate a stable conversation id based on two user ids (sorted)
messageSchema.statics.generateConversationId = function (userIdA, userIdB) {
    const [a, b] = [String(userIdA), String(userIdB)].sort()
    return `${a}:${b}`
}

module.exports =
    mongoose.models.Message || mongoose.model("Message", messageSchema)
