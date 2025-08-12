const path = require("path")
const dotenv = require("dotenv")

// Load .env if present
dotenv.config({ path: path.resolve(process.cwd(), ".env") })

const required = (value, fallback) => {
    if (typeof value === "undefined" || value === null || value === "") {
        return fallback
    }
    return value
}

const NODE_ENV = required(process.env.NODE_ENV, "development")

const toBool = (v, fallback = false) => {
    if (typeof v === "undefined") return fallback
    return ["1", "true", "yes", "on"].includes(String(v).toLowerCase())
}

module.exports = {
    nodeEnv: NODE_ENV,
    isProduction: NODE_ENV === "production",
    isDevelopment: NODE_ENV !== "production",

    port: Number(required(process.env.PORT, 8000)),

    mongoUri: required(
        process.env.MONGODB_URI,
        "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin"
    ),

    jwtSecret: required(
        process.env.JWT_SECRET,
        "change-me-in-production-very-long-secret"
    ),

    corsOrigins: required(process.env.CORS_ORIGINS, "*")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),

    rateLimit: {
        windowMs: Number(required(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000)),
        max: Number(required(process.env.RATE_LIMIT_MAX, 100)),
    },

    seed: {
        admin: toBool(process.env.SEED_ADMIN, true),
        sample: toBool(process.env.SEED_SAMPLE, false),
    },
}
