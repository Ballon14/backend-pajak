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

async function fixUserIssue() {
    try {
        console.log("🔍 Connecting to MongoDB...")
        await mongoose.connect(MONGODB_URI)
        console.log("✅ Connected to MongoDB")

        // Step 1: Get all users
        const users = await User.find().select("-password")
        console.log("\n👥 Current Users:")
        users.forEach((user, index) => {
            console.log(
                `${index + 1}. ${user.name} (${user.email}) - ID: ${user._id}`
            )
        })

        // Step 2: Get all tax records
        const taxRecords = await TaxRecord.find()
        console.log("\n📋 Current Tax Records:")
        taxRecords.forEach((record, index) => {
            console.log(
                `${index + 1}. ${record.tax_type} - ${
                    record.spt_number
                } - User ID: ${record.user_id}`
            )
        })

        // Step 3: Find orphaned records
        const userIds = users.map((user) => user._id.toString())
        const orphanedRecords = taxRecords.filter(
            (record) => !userIds.includes(record.user_id.toString())
        )

        console.log(`\n⚠️  Found ${orphanedRecords.length} orphaned records`)

        if (orphanedRecords.length > 0) {
            // Step 4: Delete orphaned records
            console.log("🗑️  Deleting orphaned records...")
            for (const record of orphanedRecords) {
                await TaxRecord.findByIdAndDelete(record._id)
                console.log(
                    `   - Deleted: ${record.tax_type} - ${record.spt_number}`
                )
            }
        }

        // Step 5: Ensure we have one main user
        let mainUser = await User.findOne({ email: "iqbaldev.site@gmail.com" })

        if (!mainUser) {
            console.log("\n👤 Creating main user...")
            const bcrypt = require("bcrypt")
            const hashedPassword = await bcrypt.hash("iqbaldev.site", 10)

            mainUser = new User({
                name: "Admin Iqbal",
                email: "iqbaldev.site@gmail.com",
                password: hashedPassword,
                is_admin: false,
                is_active: true,
            })
            await mainUser.save()
            console.log("✅ Main user created")
        } else {
            console.log("\n✅ Main user exists")
        }

        // Step 6: Check if main user has tax records
        const mainUserRecords = await TaxRecord.find({ user_id: mainUser._id })
        console.log(`\n📊 Main user has ${mainUserRecords.length} tax records`)

        if (mainUserRecords.length === 0) {
            console.log("📝 Creating sample tax records for main user...")

            const sampleRecords = [
                {
                    user_id: mainUser._id,
                    tax_type: "PBB",
                    spt_number: "SPT-2024-001",
                    period: "Januari-Juni",
                    year: 2024,
                    amount: 2500000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "lunas",
                    due_date: new Date("2024-06-30"),
                    payment_date: new Date("2024-06-15"),
                    notes: "Pembayaran tepat waktu",
                },
                {
                    user_id: mainUser._id,
                    tax_type: "PBB",
                    spt_number: "SPT-2024-002",
                    period: "Juli-Desember",
                    year: 2024,
                    amount: 2800000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "belum_lunas",
                    due_date: new Date("2024-12-31"),
                    payment_date: null,
                    notes: "Belum dibayar",
                },
                {
                    user_id: mainUser._id,
                    tax_type: "PBB",
                    spt_number: "SPT-2023-001",
                    period: "Januari-Juni",
                    year: 2023,
                    amount: 2200000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "lunas",
                    due_date: new Date("2023-06-30"),
                    payment_date: new Date("2023-06-20"),
                    notes: "Pembayaran tepat waktu",
                },
            ]

            await TaxRecord.insertMany(sampleRecords)
            console.log("✅ Sample tax records created")
        }

        // Step 7: Final verification
        console.log("\n🔍 Final verification...")
        const finalUsers = await User.find().select("-password")
        const finalRecords = await TaxRecord.find()

        console.log(`👥 Total users: ${finalUsers.length}`)
        console.log(`📋 Total tax records: ${finalRecords.length}`)

        const finalUserIds = finalUsers.map((user) => user._id.toString())
        const finalOrphanedRecords = finalRecords.filter(
            (record) => !finalUserIds.includes(record.user_id.toString())
        )

        if (finalOrphanedRecords.length === 0) {
            console.log("✅ No orphaned records found")
        } else {
            console.log(
                `⚠️  Still have ${finalOrphanedRecords.length} orphaned records`
            )
        }

        console.log("\n🎉 User issue fixed successfully!")
        console.log("📧 Login with: iqbaldev.site@gmail.com")
        console.log("🔑 Password: iqbaldev.site")
    } catch (error) {
        console.error("❌ Error:", error)
    } finally {
        await mongoose.disconnect()
        console.log("\n🔌 Disconnected from MongoDB")
    }
}

fixUserIssue()
