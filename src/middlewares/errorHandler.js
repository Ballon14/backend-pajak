function notFoundHandler(req, res, next) {
    res.status(404).json({
        success: false,
        message: "Endpoint tidak ditemukan",
    })
}

function errorHandler(err, req, res, next) {
    console.error("Unhandled error:", err)
    const status = err.status || 500
    const message = err.message || "Terjadi kesalahan pada server"
    res.status(status).json({ success: false, message })
}

module.exports = { notFoundHandler, errorHandler }
