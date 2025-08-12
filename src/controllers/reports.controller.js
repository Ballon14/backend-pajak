const TaxRecord = require("../models/TaxRecord")

function resolveDateRange(dateRange) {
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
        case "this_quarter": {
            const quarter = Math.floor(now.getMonth() / 3)
            startDate = new Date(now.getFullYear(), quarter * 3, 1)
            endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
            break
        }
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
    return { startDate, endDate }
}

async function summary(req, res) {
    try {
        const { dateRange = "this_year" } = req.query
        const { startDate, endDate } = resolveDateRange(dateRange)
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            createdAt: { $gte: startDate, $lte: endDate },
        })

        const data = {
            totalTax: taxRecords.reduce((sum, r) => sum + r.amount, 0),
            paidTax: taxRecords
                .filter((r) => r.status === "lunas")
                .reduce((s, r) => s + r.amount, 0),
        }
        data.unpaidTax = data.totalTax - data.paidTax
        data.totalRecords = taxRecords.length
        data.paidRecords = taxRecords.filter((r) => r.status === "lunas").length
        data.unpaidRecords = data.totalRecords - data.paidRecords

        res.json({
            success: true,
            message: "Data ringkasan berhasil diambil",
            data,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data ringkasan",
        })
    }
}

async function property(req, res) {
    try {
        const { dateRange = "this_year" } = req.query
        const { startDate, endDate } = resolveDateRange(dateRange)
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            createdAt: { $gte: startDate, $lte: endDate },
        })

        const propertyGroups = {}
        for (const record of taxRecords) {
            const propertyType = record.tax_type || "Lainnya"
            if (!propertyGroups[propertyType]) {
                propertyGroups[propertyType] = { amount: 0, count: 0 }
            }
            propertyGroups[propertyType].amount += record.amount
            propertyGroups[propertyType].count += 1
        }

        const totalAmount = Object.values(propertyGroups).reduce(
            (s, g) => s + g.amount,
            0
        )
        const propertyData = Object.entries(propertyGroups).map(
            ([property, d]) => ({
                property,
                amount: d.amount,
                percentage:
                    totalAmount > 0
                        ? Math.round((d.amount / totalAmount) * 1000) / 10
                        : 0,
            })
        )

        res.json({
            success: true,
            message: "Data properti berhasil diambil",
            data: propertyData,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data properti",
        })
    }
}

module.exports = { summary, property }
