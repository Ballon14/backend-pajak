const mongoose = require("mongoose")
require("dotenv").config()

// MongoDB connection
const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin"

// User Schema
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        is_admin: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema)

async function preventUserDuplication() {
    try {
        console.log("🔍 Connecting to MongoDB...")
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected to MongoDB")

        // Check for duplicate users
        const users = await User.find()
        console.log(`\n👥 Total users found: ${users.length}`)

        if (users.length > 1) {
            console.log("⚠️  Multiple users detected!")

            // Find the main user (iqbaldev.site@gmail.com)
            const mainUser = users.find(
                (user) => user.email === "iqbaldev.site@gmail.com"
            )

            if (mainUser) {
                console.log("✅ Main user found:", mainUser.email)

                // Delete other users
                const otherUsers = users.filter(
                    (user) => user.email !== "iqbaldev.site@gmail.com"
                )
                console.log(
                    `🗑️  Deleting ${otherUsers.length} duplicate users...`
                )

                for (const user of otherUsers) {
                    await User.findByIdAndDelete(user._id)
                    console.log(`   - Deleted: ${user.email}`)
                }

                console.log("✅ Duplicate users cleaned up")
            } else {
                console.log("❌ Main user not found!")
            }
        } else {
            console.log("✅ No duplicate users found")
        }

        // Verify final state
        const finalUsers = await User.find()
        console.log(`\n📊 Final user count: ${finalUsers.length}`)

        if (finalUsers.length === 1) {
            const user = finalUsers[0]
            console.log("✅ Single user maintained:")
            console.log(`   - Email: ${user.email}`)
            console.log(`   - Name: ${user.name}`)
            console.log(`   - ID: ${user._id}`)
        }

        console.log("\n🎉 User duplication prevention completed!")
    } catch (error) {
        console.error("❌ Error:", error)
    } finally {
        await mongoose.disconnect()
        console.log("\n🔌 Disconnected from MongoDB")
    }
}

preventUserDuplication()
