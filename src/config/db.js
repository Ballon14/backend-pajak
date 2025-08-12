const mongoose = require("mongoose")
const { mongoUri } = require("./env")

mongoose.set("strictQuery", true)

async function connectToDatabase() {
    try {
        await mongoose.connect(mongoUri)
        console.log(`✅ Connected to MongoDB: ${mongoUri}`)
    } catch (error) {
        console.error("❌ MongoDB connection error:", error.message)
        throw error
    }
}

module.exports = { connectToDatabase }
