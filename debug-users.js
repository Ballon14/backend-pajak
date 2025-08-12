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

// TaxRecord Schema
const taxRecordSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tax_type: { type: String, required: true },
        spt_number: { type: String, required: true },
        period: { type: String, required: true },
        year: { type: Number, required: true },
        amount: { type: Number, required: true },
        description: { type: String },
        status: {
            type: String,
            enum: ["lunas", "belum_lunas", "proses"],
            default: "belum_lunas",
        },
        due_date: { type: Date },
        payment_date: { type: Date },
        notes: { type: String },
    },
    { timestamps: true }
)

const User = mongoose.model("User", userSchema)
const TaxRecord = mongoose.model("TaxRecord", taxRecordSchema)

async function debugUsers() {
    try {
        console.log("🔍 Connecting to MongoDB...")
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected to MongoDB")

        // Get all users
        const users = await User.find().select("-password")
        console.log("\n👥 All Users:")
        console.log("Total users:", users.length)

        users.forEach((user, index) => {
            console.log(`\n${index + 1}. User ID: ${user._id}`)
            console.log(`   Name: ${user.name}`)
            console.log(`   Email: ${user.email}`)
            console.log(`   Admin: ${user.is_admin}`)
            console.log(`   Active: ${user.is_active}`)
            console.log(`   Created: ${user.createdAt}`)
        })

        // Get all tax records
        const taxRecords = await TaxRecord.find()
        console.log("\n📋 All Tax Records:")
        console.log("Total tax records:", taxRecords.length)

        taxRecords.forEach((record, index) => {
            console.log(`\n${index + 1}. Record ID: ${record._id}`)
            console.log(`   User ID: ${record.user_id}`)
            console.log(`   Tax Type: ${record.tax_type}`)
            console.log(`   SPT Number: ${record.spt_number}`)
            console.log(`   Amount: ${record.amount}`)
            console.log(`   Status: ${record.status}`)
        })

        // Check for orphaned records (records without valid user)
        console.log("\n🔍 Checking for orphaned records...")
        const userIds = users.map((user) => user._id.toString())
        const orphanedRecords = taxRecords.filter(
            (record) => !userIds.includes(record.user_id.toString())
        )

        if (orphanedRecords.length > 0) {
            console.log(`⚠️  Found ${orphanedRecords.length} orphaned records:`)
            orphanedRecords.forEach((record) => {
                console.log(
                    `   - Record ID: ${record._id}, User ID: ${record.user_id}`
                )
            })
        } else {
            console.log("✅ No orphaned records found")
        }

        // Check for users without tax records
        console.log("\n🔍 Checking for users without tax records...")
        const usersWithoutRecords = users.filter((user) => {
            const userRecords = taxRecords.filter(
                (record) => record.user_id.toString() === user._id.toString()
            )
            return userRecords.length === 0
        })

        if (usersWithoutRecords.length > 0) {
            console.log(
                `⚠️  Found ${usersWithoutRecords.length} users without tax records:`
            )
            usersWithoutRecords.forEach((user) => {
                console.log(`   - User: ${user.name} (${user.email})`)
            })
        } else {
            console.log("✅ All users have tax records")
        }
    } catch (error) {
        console.error("❌ Error:", error)
    } finally {
        await mongoose.disconnect()
        console.log("\n🔌 Disconnected from MongoDB")
    }
}

debugUsers()
