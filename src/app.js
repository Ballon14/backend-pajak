const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const path = require("path")

const {
    corsOrigins,
    rateLimit: rlConfig,
    isDevelopment,
} = require("./config/env")
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler")

const authRoutes = require("./routes/auth.routes")
const taxRoutes = require("./routes/tax.routes")
const adminRoutes = require("./routes/admin.routes")
const reportsRoutes = require("./routes/reports.routes")
const messageRoutes = require("./routes/message.routes")

const app = express()

// Security & basics with custom CSP for images
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "http://localhost:8000",
                    "http://localhost:5173",
                ],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
    })
)
app.use(compression())
app.use(express.json())

// CORS
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true)
            if (corsOrigins.includes("*") || corsOrigins.includes(origin)) {
                return callback(null, true)
            }
            return callback(new Error("Not allowed by CORS"))
        },
        credentials: true,
    })
)

// Serve static files from uploads directory (after CORS)
app.use(
    "/uploads",
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*")
        res.header("Access-Control-Allow-Methods", "GET")
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        )
        next()
    },
    express.static(path.join(__dirname, "../uploads"))
)

// Logger
app.use(morgan(isDevelopment ? "dev" : "combined"))

// Rate limiting
app.use(
    "/api/",
    rateLimit({
        windowMs: rlConfig.windowMs,
        max: rlConfig.max,
        standardHeaders: true,
        legacyHeaders: false,
    })
)

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/tax-records", taxRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/messages", messageRoutes)

// 404 and error handlers
app.use(notFoundHandler)
app.use(errorHandler)

module.exports = app
