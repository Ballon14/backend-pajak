const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { body, validationResult } = require("express-validator")

const app = express()
const PORT = process.env.PORT || 8000
const JWT_SECRET =
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-this-in-production"
const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin"

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB with exrejak database
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("✅ Connected to MongoDB database: exrejak"))
    .catch((err) => console.error("❌ MongoDB connection error:", err))

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

// Tax Record Schema
const taxRecordSchema = new mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: { type: String, required: true },
        address: { type: String, required: true },
        tax_type: { type: String, required: true },
        spt_number: { type: String, required: true },
        year: { type: Number, required: true },
        amount: { type: Number, required: true },
        description: { type: String },
        status: {
            type: String,
            enum: ["belum_lunas", "proses", "lunas"],
            required: true,
        },
        due_date: { type: Date, required: true },
        payment_date: { type: Date },
        notes: { type: String },
    },
    { timestamps: true }
)

const TaxRecord = mongoose.model("TaxRecord", taxRecordSchema)

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
        return res
            .status(401)
            .json({ success: false, message: "Token tidak ditemukan" })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res
                .status(401)
                .json({ success: false, message: "Token tidak valid" })
        }
        req.user = user
        next()
    })
}

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (!req.user.is_admin) {
        return res
            .status(403)
            .json({ success: false, message: "Akses ditolak" })
    }
    next()
}

// Auto-create tax records for new year
const createTaxRecordsForNewYear = async (userId, newYear) => {
    try {
        console.log(
            `🔄 Creating tax records for year ${newYear} for user ${userId}`
        )

        // Check if tax records already exist for the new year
        const existingRecords = await TaxRecord.find({
            user_id: userId,
            year: newYear,
        })

        if (existingRecords.length > 0) {
            console.log(`✅ Tax records for year ${newYear} already exist`)
            return {
                success: true,
                message: `Data PBB untuk tahun ${newYear} sudah ada`,
                count: existingRecords.length,
            }
        }

        // Get the latest tax records from previous year to use as template
        const previousYear = newYear - 1
        const previousRecords = await TaxRecord.find({
            user_id: userId,
            year: previousYear,
        }).sort({ createdAt: -1 })

        if (previousRecords.length === 0) {
            console.log(`❌ No previous records found for year ${previousYear}`)
            return {
                success: false,
                message: `Tidak ada data PBB tahun ${previousYear} untuk digunakan sebagai template`,
            }
        }

        // Create new tax records based on previous year's data
        const newRecords = []
        const outstandingRecords = []

        for (const prevRecord of previousRecords) {
            // Check if previous record is unpaid
            const isUnpaid =
                prevRecord.status === "belum_lunas" ||
                prevRecord.status === "proses"

            if (isUnpaid) {
                // Create outstanding record (tunggakan)
                const outstandingRecord = {
                    user_id: userId,
                    name: prevRecord.name,
                    address: prevRecord.address,
                    tax_type: "PBB",
                    spt_number: `TUNGGAKAN-${previousYear}-${String(
                        outstandingRecords.length + 1
                    ).padStart(3, "0")}`,

                    year: previousYear,
                    amount: prevRecord.amount,
                    description: `TUNGGAKAN: ${
                        prevRecord.description || "Pajak Bumi dan Bangunan"
                    } - Tahun ${previousYear}`,
                    status: "belum_lunas",
                    due_date: prevRecord.due_date,
                    payment_date: null,
                    notes: `Tunggakan dari tahun ${previousYear} - ${
                        prevRecord.notes || "Belum dibayar"
                    }`,
                }
                outstandingRecords.push(outstandingRecord)
            }

            // Create new record for current year
            const newRecord = {
                user_id: userId,
                name: prevRecord.name,
                address: prevRecord.address,
                tax_type: "PBB",
                spt_number: `SPT-${newYear}-${String(
                    newRecords.length + 1
                ).padStart(3, "0")}`,

                year: newYear,
                amount: Math.round(prevRecord.amount * 1.1), // Increase by 10%
                description: `Pajak Bumi dan Bangunan untuk ${
                    prevRecord.description || "properti"
                } - Tahun ${newYear}`,
                status: "belum_lunas",
                due_date: new Date(`${newYear}-06-30`),
                payment_date: null,
                notes: `Data otomatis dibuat dari tahun ${previousYear}`,
            }

            newRecords.push(newRecord)
        }

        // Insert all records (outstanding + new)
        const allRecords = [...outstandingRecords, ...newRecords]
        const createdRecords = await TaxRecord.insertMany(allRecords)

        console.log(
            `✅ Created ${createdRecords.length} tax records for year ${newYear}`
        )
        console.log(`📋 Outstanding records: ${outstandingRecords.length}`)
        console.log(`🆕 New year records: ${newRecords.length}`)

        return {
            success: true,
            message: `Berhasil membuat ${createdRecords.length} data PBB untuk tahun ${newYear}`,
            count: createdRecords.length,
            outstandingCount: outstandingRecords.length,
            newYearCount: newRecords.length,
            data: createdRecords,
        }
    } catch (error) {
        console.error("❌ Error creating tax records for new year:", error)
        return {
            success: false,
            message: "Terjadi kesalahan saat membuat data PBB untuk tahun baru",
        }
    }
}

// Routes

// Auth Routes
app.post(
    "/api/auth/register",
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("email").isEmail().withMessage("Email tidak valid"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password minimal 6 karakter"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const { name, email, password } = req.body

            // Check if user already exists
            const existingUser = await User.findOne({ email })
            if (existingUser) {
                return res
                    .status(400)
                    .json({ success: false, message: "Email sudah terdaftar" })
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10)

            // Create user
            const user = new User({
                name,
                email,
                password: hashedPassword,
            })

            await user.save()

            res.status(201).json({
                success: true,
                message: "Registrasi berhasil",
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        is_admin: user.is_admin,
                        is_active: user.is_active,
                    },
                },
            })
        } catch (error) {
            console.error("Register error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat registrasi",
            })
        }
    }
)

app.post(
    "/api/auth/login",
    [
        body("email").isEmail().withMessage("Email tidak valid"),
        body("password").notEmpty().withMessage("Password harus diisi"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const { email, password } = req.body

            // Find user
            const user = await User.findOne({ email })
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Email atau password salah",
                })
            }

            if (!user.is_active) {
                return res
                    .status(401)
                    .json({ success: false, message: "Akun Anda nonaktif" })
            }

            // Check password
            const isValidPassword = await bcrypt.compare(
                password,
                user.password
            )
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    message: "Email atau password salah",
                })
            }

            // Generate token
            const token = jwt.sign(
                {
                    user_id: user._id,
                    email: user.email,
                    name: user.name,
                    is_admin: user.is_admin,
                },
                JWT_SECRET,
                { expiresIn: "7d" }
            )

            res.json({
                success: true,
                message: "Login berhasil",
                data: {
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        is_active: user.is_active,
                        is_admin: user.is_admin,
                    },
                    token,
                },
            })
        } catch (error) {
            console.error("Login error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat login",
            })
        }
    }
)

app.post("/api/auth/logout", authenticateToken, (req, res) => {
    res.json({ success: true, message: "Logout berhasil" })
})

app.get("/api/auth/user", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id).select("-password")
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User tidak ditemukan" })
        }
        res.json({ success: true, data: user })
    } catch (error) {
        console.error("Get user error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data user",
        })
    }
})

// Tax Records Routes
app.get("/api/tax-records", authenticateToken, async (req, res) => {
    try {
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
        }).sort({ createdAt: -1 })

        res.json({
            success: true,
            message: "Data PBB berhasil diambil",
            data: taxRecords,
        })
    } catch (error) {
        console.error("Get tax records error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB",
        })
    }
})

// Auto-create tax records for new year endpoint
app.post(
    "/api/tax-records/auto-create",
    authenticateToken,
    async (req, res) => {
        try {
            const { year } = req.body
            const newYear = year || new Date().getFullYear()

            const result = await createTaxRecordsForNewYear(
                req.user.user_id,
                newYear
            )

            if (result.success) {
                res.json(result)
            } else {
                res.status(400).json(result)
            }
        } catch (error) {
            console.error("Auto-create tax records error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat membuat data PBB otomatis",
            })
        }
    }
)

// Check and auto-create for current year endpoint
app.get("/api/tax-records/check-year", authenticateToken, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear()

        // Check if current year records exist
        const currentYearRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            year: currentYear,
        })

        if (currentYearRecords.length === 0) {
            // Auto-create records for current year
            const result = await createTaxRecordsForNewYear(
                req.user.user_id,
                currentYear
            )
            res.json({
                success: true,
                message: "Data PBB untuk tahun baru telah dibuat otomatis",
                autoCreated: true,
                ...result,
            })
        } else {
            res.json({
                success: true,
                message: `Data PBB untuk tahun ${currentYear} sudah ada`,
                autoCreated: false,
                count: currentYearRecords.length,
            })
        }
    } catch (error) {
        console.error("Check year error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memeriksa data tahun",
        })
    }
})

app.get("/api/tax-records/statistics", authenticateToken, async (req, res) => {
    try {
        const taxRecords = await TaxRecord.find({ user_id: req.user.user_id })

        if (taxRecords.length === 0) {
            return res
                .status(404)
                .json({ success: false, message: "Data PBB tidak ditemukan" })
        }

        const totalTax = taxRecords.reduce(
            (sum, record) => sum + record.amount,
            0
        )
        const paidTax = taxRecords
            .filter((record) => record.status === "lunas")
            .reduce((sum, record) => sum + record.amount, 0)
        const unpaidTax = totalTax - paidTax

        const totalRecords = taxRecords.length
        const paidRecords = taxRecords.filter(
            (record) => record.status === "lunas"
        ).length
        const unpaidRecords = totalRecords - paidRecords

        res.json({
            success: true,
            data: {
                total_tax: totalTax,
                paid_tax: paidTax,
                unpaid_tax: unpaidTax,
                total_records: totalRecords,
                paid_records: paidRecords,
                unpaid_records: unpaidRecords,
            },
        })
    } catch (error) {
        console.error("Statistics error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil statistik",
        })
    }
})

app.post(
    "/api/tax-records",
    authenticateToken,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const taxRecord = new TaxRecord({
                ...req.body,
                user_id: req.user.user_id,
            })

            await taxRecord.save()

            res.status(201).json({
                success: true,
                message: "Data PBB berhasil ditambahkan",
                data: taxRecord,
            })
        } catch (error) {
            console.error("Create tax record error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat menambahkan data PBB",
            })
        }
    }
)

app.get("/api/tax-records/:id", authenticateToken, async (req, res) => {
    try {
        const taxRecord = await TaxRecord.findOne({
            _id: req.params.id,
            user_id: req.user.user_id,
        })

        if (!taxRecord) {
            return res
                .status(404)
                .json({ success: false, message: "Data PBB tidak ditemukan" })
        }

        res.json({
            success: true,
            message: "Data PBB berhasil diambil",
            data: taxRecord,
        })
    } catch (error) {
        console.error("Get tax record error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB",
        })
    }
})

app.put(
    "/api/tax-records/:id",
    authenticateToken,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2020, max: 2030 })
            .withMessage("Tahun harus antara 2020-2030"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah harus lebih dari 0"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
        body("due_date")
            .isISO8601()
            .withMessage("Tanggal jatuh tempo tidak valid"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const taxRecord = await TaxRecord.findOneAndUpdate(
                { _id: req.params.id, user_id: req.user.user_id },
                req.body,
                { new: true }
            )

            if (!taxRecord) {
                return res.status(404).json({
                    success: false,
                    message: "Data PBB tidak ditemukan",
                })
            }

            res.json({
                success: true,
                message: "Data PBB berhasil diperbarui",
                data: taxRecord,
            })
        } catch (error) {
            console.error("Update tax record error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat memperbarui data PBB",
            })
        }
    }
)

app.delete("/api/tax-records/:id", authenticateToken, async (req, res) => {
    try {
        const taxRecord = await TaxRecord.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user.user_id,
        })

        if (!taxRecord) {
            return res
                .status(404)
                .json({ success: false, message: "Data PBB tidak ditemukan" })
        }

        res.json({ success: true, message: "Data PBB berhasil dihapus" })
    } catch (error) {
        console.error("Delete tax record error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghapus data PBB",
        })
    }
})

// Reports Routes
app.get("/api/reports/summary", authenticateToken, async (req, res) => {
    try {
        const { dateRange = "this_year" } = req.query

        // Get date range filter
        let startDate, endDate
        const now = new Date()

        switch (dateRange) {
            case "this_month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                break
            case "last_month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                break
            case "this_quarter":
                const quarter = Math.floor(now.getMonth() / 3)
                startDate = new Date(now.getFullYear(), quarter * 3, 1)
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
                break
            case "this_year":
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31)
                break
            case "last_year":
                startDate = new Date(now.getFullYear() - 1, 0, 1)
                endDate = new Date(now.getFullYear() - 1, 11, 31)
                break
            default:
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31)
        }

        // Get tax records for the user within date range
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            createdAt: { $gte: startDate, $lte: endDate },
        })

        // Calculate summary
        const summary = {
            totalTax: taxRecords.reduce(
                (sum, record) => sum + record.amount,
                0
            ),
            paidTax: taxRecords
                .filter((record) => record.status === "lunas")
                .reduce((sum, record) => sum + record.amount, 0),
            unpaidTax: taxRecords
                .filter((record) => record.status !== "lunas")
                .reduce((sum, record) => sum + record.amount, 0),
            totalRecords: taxRecords.length,
            paidRecords: taxRecords.filter(
                (record) => record.status === "lunas"
            ).length,
            unpaidRecords: taxRecords.filter(
                (record) => record.status !== "lunas"
            ).length,
        }

        res.json({
            success: true,
            message: "Data ringkasan berhasil diambil",
            data: summary,
        })
    } catch (error) {
        console.error("Get summary report error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data ringkasan",
        })
    }
})

app.get("/api/reports/property", authenticateToken, async (req, res) => {
    try {
        const { dateRange = "this_year" } = req.query

        // Get date range filter
        let startDate, endDate
        const now = new Date()

        switch (dateRange) {
            case "this_month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                break
            case "last_month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
                endDate = new Date(now.getFullYear(), now.getMonth(), 0)
                break
            case "this_quarter":
                const quarter = Math.floor(now.getMonth() / 3)
                startDate = new Date(now.getFullYear(), quarter * 3, 1)
                endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
                break
            case "this_year":
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31)
                break
            case "last_year":
                startDate = new Date(now.getFullYear() - 1, 0, 1)
                endDate = new Date(now.getFullYear() - 1, 11, 31)
                break
            default:
                startDate = new Date(now.getFullYear(), 0, 1)
                endDate = new Date(now.getFullYear(), 11, 31)
        }

        // Get tax records for the user within date range
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            createdAt: { $gte: startDate, $lte: endDate },
        })

        // Group by property type
        const propertyGroups = {}
        taxRecords.forEach((record) => {
            const propertyType = record.tax_type || "Lainnya"
            if (!propertyGroups[propertyType]) {
                propertyGroups[propertyType] = {
                    amount: 0,
                    count: 0,
                }
            }
            propertyGroups[propertyType].amount += record.amount
            propertyGroups[propertyType].count += 1
        })

        // Calculate total for percentage
        const totalAmount = Object.values(propertyGroups).reduce(
            (sum, group) => sum + group.amount,
            0
        )

        // Convert to array format
        const propertyData = Object.entries(propertyGroups).map(
            ([property, data]) => ({
                property,
                amount: data.amount,
                percentage:
                    totalAmount > 0
                        ? Math.round((data.amount / totalAmount) * 100 * 10) /
                          10
                        : 0,
            })
        )

        res.json({
            success: true,
            message: "Data properti berhasil diambil",
            data: propertyData,
        })
    } catch (error) {
        console.error("Get property report error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data properti",
        })
    }
})

// Get outstanding tax records (tunggakan)
app.get("/api/tax-records/outstanding", authenticateToken, async (req, res) => {
    try {
        const outstandingRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            spt_number: { $regex: /^TUNGGAKAN-/ },
            status: { $in: ["belum_lunas", "proses"] },
        }).sort({ year: -1, createdAt: -1 })

        const totalOutstanding = outstandingRecords.reduce(
            (sum, record) => sum + record.amount,
            0
        )

        res.json({
            success: true,
            message: "Data tunggakan berhasil diambil",
            data: outstandingRecords,
            summary: {
                totalRecords: outstandingRecords.length,
                totalAmount: totalOutstanding,
                totalOutstandingFormatted: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(totalOutstanding),
            },
        })
    } catch (error) {
        console.error("Get outstanding records error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data tunggakan",
        })
    }
})

// Get tax records by year
app.get("/api/tax-records/year/:year", authenticateToken, async (req, res) => {
    try {
        const year = parseInt(req.params.year)
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            year: year,
        }).sort({ createdAt: -1 })

        const totalAmount = taxRecords.reduce(
            (sum, record) => sum + record.amount,
            0
        )
        const paidAmount = taxRecords
            .filter((record) => record.status === "lunas")
            .reduce((sum, record) => sum + record.amount, 0)
        const unpaidAmount = totalAmount - paidAmount

        res.json({
            success: true,
            message: `Data PBB tahun ${year} berhasil diambil`,
            data: taxRecords,
            summary: {
                year: year,
                totalRecords: taxRecords.length,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                unpaidAmount: unpaidAmount,
                totalAmountFormatted: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(totalAmount),
                paidAmountFormatted: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(paidAmount),
                unpaidAmountFormatted: new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                }).format(unpaidAmount),
            },
        })
    } catch (error) {
        console.error("Get tax records by year error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB per tahun",
        })
    }
})

// Admin Routes
app.get("/api/admin/users", authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
        res.json({
            success: true,
            data: { data: users }, // Wrap in data object for consistency
        })
    } catch (error) {
        console.error("Get users error:", error)
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data users",
        })
    }
})

// Admin - Get user by ID
app.get(
    "/api/admin/users/:id",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id).select("-password")
            if (!user) {
                return res
                    .status(404)
                    .json({ success: false, message: "User tidak ditemukan" })
            }
            res.json({ success: true, data: user })
        } catch (error) {
            console.error("Get user by id error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengambil data user",
            })
        }
    }
)

// Admin - Update user
app.put(
    "/api/admin/users/:id",
    authenticateToken,
    isAdmin,
    [
        body("name")
            .optional()
            .isString()
            .notEmpty()
            .withMessage("Nama harus diisi"),
        body("email").optional().isEmail().withMessage("Email harus valid"),
        body("is_admin")
            .optional()
            .isBoolean()
            .withMessage("is_admin harus boolean"),
        body("is_active")
            .optional()
            .isBoolean()
            .withMessage("is_active harus boolean"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const { name, email, is_admin, is_active } = req.body

            if (email) {
                const existing = await User.findOne({
                    email: email,
                    _id: { $ne: req.params.id },
                })
                if (existing) {
                    return res.status(409).json({
                        success: false,
                        message: "Email sudah digunakan oleh user lain",
                    })
                }
            }

            const updateFields = {}
            if (typeof name !== "undefined") updateFields.name = name
            if (typeof email !== "undefined") updateFields.email = email
            if (typeof is_admin !== "undefined")
                updateFields.is_admin = is_admin
            if (typeof is_active !== "undefined")
                updateFields.is_active = is_active

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                updateFields,
                { new: true }
            ).select("-password")

            if (!updatedUser) {
                return res
                    .status(404)
                    .json({ success: false, message: "User tidak ditemukan" })
            }

            res.json({
                success: true,
                message: "User berhasil diperbarui",
                data: updatedUser,
            })
        } catch (error) {
            console.error("Update user error:", error)
            if (error && error.code === 11000) {
                return res.status(409).json({
                    success: false,
                    message: "Email sudah digunakan oleh user lain",
                })
            }
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat memperbarui user",
            })
        }
    }
)

// Admin - Delete user
app.delete(
    "/api/admin/users/:id",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const deleted = await User.findByIdAndDelete(req.params.id)
            if (!deleted) {
                return res
                    .status(404)
                    .json({ success: false, message: "User tidak ditemukan" })
            }
            res.json({ success: true, message: "User berhasil dihapus" })
        } catch (error) {
            console.error("Delete user error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat menghapus user",
            })
        }
    }
)

// Admin - Toggle user active status
app.put(
    "/api/admin/users/:id/toggle-status",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
            if (!user) {
                return res
                    .status(404)
                    .json({ success: false, message: "User tidak ditemukan" })
            }
            user.is_active = !user.is_active
            await user.save()
            const sanitized = user.toObject()
            delete sanitized.password
            res.json({
                success: true,
                message: `Status user berhasil diubah menjadi ${
                    sanitized.is_active ? "Active" : "Inactive"
                }`,
                data: sanitized,
            })
        } catch (error) {
            console.error("Toggle user status error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengubah status user",
            })
        }
    }
)

// Admin - Get all tax records
app.get(
    "/api/admin/tax-records",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const taxRecords = await TaxRecord.find()
                .populate("user_id", "name email")
                .sort({ createdAt: -1 })

            // Transform data to match frontend expectations
            const transformedRecords = taxRecords.map((record) => ({
                id: record._id,
                name: record.name,
                address: record.address,
                tax_type: record.tax_type,
                spt_number: record.spt_number,
                year: record.year,
                total: record.amount, // Frontend expects 'total' not 'amount'
                amount: record.amount,
                description: record.description,
                status: record.status,
                due_date: record.due_date,
                payment_date: record.payment_date,
                notes: record.notes,
                user: record.user_id
                    ? {
                          name: record.user_id.name,
                          email: record.user_id.email,
                      }
                    : null,
                created_at: record.createdAt,
                updated_at: record.updatedAt,
            }))

            res.json({
                success: true,
                data: { data: transformedRecords },
            })
        } catch (error) {
            console.error("Get admin tax records error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengambil data pajak",
            })
        }
    }
)

// Admin - Get single tax record by ID
app.get(
    "/api/admin/tax-records/:id",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            const taxRecord = await TaxRecord.findById(req.params.id).populate(
                "user_id",
                "name email"
            )

            if (!taxRecord) {
                return res.status(404).json({
                    success: false,
                    message: "Data pajak tidak ditemukan",
                })
            }

            // Transform data to match frontend expectations
            const transformedRecord = {
                id: taxRecord._id,
                name: taxRecord.name,
                address: taxRecord.address,
                tax_type: taxRecord.tax_type,
                spt_number: taxRecord.spt_number,
                year: taxRecord.year,
                total: taxRecord.amount,
                amount: taxRecord.amount,
                description: taxRecord.description,
                status: taxRecord.status,
                due_date: taxRecord.due_date,
                payment_date: taxRecord.payment_date,
                notes: taxRecord.notes,
                user: taxRecord.user_id
                    ? {
                          name: taxRecord.user_id.name,
                          email: taxRecord.user_id.email,
                      }
                    : null,
                created_at: taxRecord.createdAt,
                updated_at: taxRecord.updatedAt,
            }

            res.json({
                success: true,
                data: transformedRecord,
            })
        } catch (error) {
            console.error("Get admin tax record error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengambil data pajak",
            })
        }
    }
)

// Admin - Update tax record
app.put(
    "/api/admin/tax-records/:id",
    authenticateToken,
    isAdmin,
    [
        body("name").notEmpty().withMessage("Nama harus diisi"),
        body("address").notEmpty().withMessage("Alamat harus diisi"),
        body("tax_type").notEmpty().withMessage("Jenis pajak harus diisi"),
        body("spt_number").notEmpty().withMessage("Nomor SPT harus diisi"),
        body("year")
            .isInt({ min: 2000, max: 2030 })
            .withMessage("Tahun harus valid"),
        body("amount")
            .isFloat({ min: 0 })
            .withMessage("Jumlah pajak harus valid"),
        body("status")
            .isIn(["belum_lunas", "proses", "lunas"])
            .withMessage("Status tidak valid"),
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(422).json({
                    success: false,
                    message: "Validasi gagal",
                    errors: errors.array(),
                })
            }

            const taxRecord = await TaxRecord.findById(req.params.id)
            if (!taxRecord) {
                return res.status(404).json({
                    success: false,
                    message: "Data pajak tidak ditemukan",
                })
            }

            const {
                name,
                address,
                tax_type,
                spt_number,
                year,
                amount,
                description,
                status,
                due_date,
                payment_date,
                notes,
            } = req.body

            // Update tax record
            taxRecord.name = name
            taxRecord.address = address
            taxRecord.tax_type = tax_type
            taxRecord.spt_number = spt_number
            taxRecord.year = year
            taxRecord.amount = amount
            taxRecord.description = description || ""
            taxRecord.status = status
            taxRecord.due_date = due_date ? new Date(due_date) : null
            taxRecord.payment_date = payment_date
                ? new Date(payment_date)
                : null
            taxRecord.notes = notes || ""

            await taxRecord.save()

            res.json({
                success: true,
                message: "Data pajak berhasil diperbarui",
                data: {
                    id: taxRecord._id,
                    name: taxRecord.name,
                    address: taxRecord.address,
                    tax_type: taxRecord.tax_type,
                    spt_number: taxRecord.spt_number,
                    year: taxRecord.year,
                    amount: taxRecord.amount,
                    description: taxRecord.description,
                    status: taxRecord.status,
                    due_date: taxRecord.due_date,
                    payment_date: taxRecord.payment_date,
                    notes: taxRecord.notes,
                },
            })
        } catch (error) {
            console.error("Update admin tax record error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat memperbarui data pajak",
            })
        }
    }
)

// Admin - Get statistics
app.get(
    "/api/admin/statistics",
    authenticateToken,
    isAdmin,
    async (req, res) => {
        try {
            // Get all users count
            const totalUsers = await User.countDocuments()
            const activeUsers = await User.countDocuments({ is_active: true })
            const adminUsers = await User.countDocuments({ is_admin: true })

            // Get all tax records
            const allTaxRecords = await TaxRecord.find()

            const totalRecords = allTaxRecords.length
            const lunas = allTaxRecords.filter(
                (record) => record.status === "lunas"
            ).length
            const belumLunas = allTaxRecords.filter(
                (record) => record.status === "belum_lunas"
            ).length
            const proses = allTaxRecords.filter(
                (record) => record.status === "proses"
            ).length

            // Calculate total amounts
            const totalTax = allTaxRecords.reduce(
                (sum, record) => sum + record.amount,
                0
            )
            const paidTax = allTaxRecords
                .filter((record) => record.status === "lunas")
                .reduce((sum, record) => sum + record.amount, 0)
            const unpaidTax = totalTax - paidTax

            res.json({
                success: true,
                data: {
                    // User statistics
                    total_users: totalUsers,
                    active_users: activeUsers,
                    admin_users: adminUsers,

                    // Tax record statistics
                    total_records: totalRecords,
                    lunas: lunas,
                    belum_lunas: belumLunas,
                    proses: proses,

                    // Amount statistics
                    total_tax: totalTax,
                    paid_tax: paidTax,
                    unpaid_tax: unpaidTax,

                    // Additional stats
                    outstanding_records: belumLunas + proses,
                    outstanding_amount: unpaidTax,
                },
            })
        } catch (error) {
            console.error("Get admin statistics error:", error)
            res.status(500).json({
                success: false,
                message: "Terjadi kesalahan saat mengambil statistik admin",
            })
        }
    }
)

// Seed data function
const seedData = async () => {
    try {
        // Check if admin user exists
        let adminUser = await User.findOne({ email: "iqbaldev.site@gmail.com" })

        if (!adminUser) {
            // Create admin user
            const hashedPassword = await bcrypt.hash("iqbaldev.site", 10)
            adminUser = new User({
                name: "Admin Iqbal",
                email: "iqbaldev.site@gmail.com",
                password: hashedPassword,
                is_admin: true, // Make this user an admin
                is_active: true,
            })
            await adminUser.save()
            console.log("✅ Admin user created")
        } else {
            console.log("✅ Admin user already exists")
        }

        // Check if tax records exist for admin user
        const existingRecords = await TaxRecord.find({ user_id: adminUser._id })

        if (existingRecords.length === 0) {
            // Create sample tax records
            const sampleRecords = [
                {
                    user_id: adminUser._id,
                    name: "Ahmad Rizki",
                    address: "Jl. Sudirman No. 123, Jakarta Pusat",
                    tax_type: "PBB",
                    spt_number: "SPT-2025-001",
                    year: 2025,
                    amount: 2500000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "lunas",
                    due_date: new Date("2025-06-30"),
                    payment_date: new Date("2025-06-15"),
                    notes: "Pembayaran tepat waktu",
                },
                {
                    user_id: adminUser._id,
                    name: "Siti Nurhaliza",
                    address: "Jl. Thamrin No. 45, Jakarta Selatan",
                    tax_type: "PBB",
                    spt_number: "SPT-2025-002",
                    year: 2025,
                    amount: 2800000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "belum_lunas",
                    due_date: new Date("2025-12-31"),
                    payment_date: null,
                    notes: "Belum dibayar",
                },
                {
                    user_id: adminUser._id,
                    name: "Budi Santoso",
                    address: "Jl. Gatot Subroto No. 67, Jakarta Barat",
                    tax_type: "PBB",
                    spt_number: "SPT-2025-003",
                    year: 2025,
                    amount: 2200000,
                    description: "Pajak Bumi dan Bangunan untuk rumah tinggal",
                    status: "lunas",
                    due_date: new Date("2025-06-30"),
                    payment_date: new Date("2025-06-20"),
                    notes: "Pembayaran tepat waktu",
                },
            ]

            await TaxRecord.insertMany(sampleRecords)
            console.log("✅ Sample tax records created")
        } else {
            console.log(
                `✅ Tax records already exist (${existingRecords.length} records)`
            )
        }

        // Clean up orphaned records
        const allUsers = await User.find()
        const userIds = allUsers.map((user) => user._id.toString())
        const orphanedRecords = await TaxRecord.find({
            user_id: { $nin: allUsers.map((user) => user._id) },
        })

        if (orphanedRecords.length > 0) {
            console.log(
                `🗑️  Cleaning up ${orphanedRecords.length} orphaned records...`
            )
            await TaxRecord.deleteMany({
                user_id: { $nin: allUsers.map((user) => user._id) },
            })
            console.log("✅ Orphaned records cleaned up")
        }

        console.log("✅ Database seeded successfully")
    } catch (error) {
        console.error("❌ Seeding error:", error)
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📊 API available at http://localhost:${PORT}/api`)

    // Seed data on startup
    await seedData()
})
