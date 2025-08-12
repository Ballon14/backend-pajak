const { connectToDatabase } = require("../src/config/db")
const User = require("../src/models/User")
const TaxRecord = require("../src/models/TaxRecord")

;(async () => {
    try {
        await connectToDatabase()

        const adminEmail = "iqbaldev.site@gmail.com"
        const admin = await User.findOne({ email: adminEmail })
        if (!admin) {
            console.log("ℹ️  Admin user not found. Nothing to delete.")
            process.exit(0)
        }

        const filter = { user_id: admin._id }
        const countBefore = await TaxRecord.countDocuments(filter)
        if (countBefore === 0) {
            console.log("ℹ️  No tax records found for admin user. Nothing to delete.")
            process.exit(0)
        }

        const result = await TaxRecord.deleteMany(filter)
        console.log(`🗑️  Deleted ${result.deletedCount} tax records for admin ${adminEmail}`)
        process.exit(0)
    } catch (error) {
        console.error("❌ Cleanup error:", error)
        process.exit(1)
    }
})() 