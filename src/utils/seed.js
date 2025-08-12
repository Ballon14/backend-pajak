const bcrypt = require("bcryptjs")
const User = require("../models/User")
const TaxRecord = require("../models/TaxRecord")

async function seedData() {
    try {
        let adminUser = await User.findOne({ email: "iqbaldev.site@gmail.com" })
        if (!adminUser) {
            const hashedPassword = await bcrypt.hash("iqbaldev.site", 10)
            adminUser = new User({
                name: "Admin Iqbal",
                email: "iqbaldev.site@gmail.com",
                password: hashedPassword,
                is_admin: true,
                is_active: true,
            })
            await adminUser.save()
            console.log("✅ Admin user created")
        } else {
            console.log("✅ Admin user already exists")
        }

        const existingRecords = await TaxRecord.find({ user_id: adminUser._id })
        if (existingRecords.length === 0) {
            const currentYear = new Date().getFullYear()
            const sampleRecords = [
                {
                    user_id: adminUser._id,
                    name: "Ahmad Rizki",
                    address: "Jl. Sudirman No. 123, Jakarta Pusat",
                    tax_type: "PBB",
                    spt_number: `SPT-${currentYear}-001`,
                    year: currentYear,
                    amount: 2500000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "lunas",
                    due_date: new Date(`${currentYear}-06-30`),
                    payment_date: new Date(`${currentYear}-06-15`),
                    notes: "Pembayaran tepat waktu",
                },
                {
                    user_id: adminUser._id,
                    name: "Siti Nurhaliza",
                    address: "Jl. Thamrin No. 45, Jakarta Selatan",
                    tax_type: "PBB",
                    spt_number: `SPT-${currentYear}-002`,
                    year: currentYear,
                    amount: 2800000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "belum_lunas",
                    due_date: new Date(`${currentYear}-12-31`),
                    payment_date: null,
                    notes: "Belum dibayar",
                },
            ]
            await TaxRecord.insertMany(sampleRecords)
            console.log("✅ Sample tax records created")
        } else {
            console.log(
                `✅ Tax records already exist (${existingRecords.length} records)`
            )
        }

        // Clean orphaned records
        const allUsers = await User.find()
        await TaxRecord.deleteMany({
            user_id: { $nin: allUsers.map((u) => u._id) },
        })
        console.log("✅ Orphaned records cleaned up")

        console.log("✅ Database seeded successfully")
    } catch (error) {
        console.error("❌ Seeding error:", error)
    }
}

module.exports = { seedData }
