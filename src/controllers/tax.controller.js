const { validationResult } = require("express-validator")
const TaxRecord = require("../models/TaxRecord")

async function list(req, res) {
    try {
        const taxRecords = await TaxRecord.find({ user_id: req.user.user_id })
            .sort({ createdAt: -1 })
            .lean()
        res.json({
            success: true,
            message: "Data PBB berhasil diambil",
            data: taxRecords,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB",
        })
    }
}

async function create(req, res) {
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menambahkan data PBB",
        })
    }
}

async function getById(req, res) {
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB",
        })
    }
}

async function update(req, res) {
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
            return res
                .status(404)
                .json({ success: false, message: "Data PBB tidak ditemukan" })
        }
        res.json({
            success: true,
            message: "Data PBB berhasil diperbarui",
            data: taxRecord,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memperbarui data PBB",
        })
    }
}

async function remove(req, res) {
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghapus data PBB",
        })
    }
}

async function statistics(req, res) {
    try {
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
        }).lean()
        if (taxRecords.length === 0) {
            return res.json({
                success: true,
                data: {
                    total_tax: 0,
                    paid_tax: 0,
                    unpaid_tax: 0,
                    total_records: 0,
                    paid_records: 0,
                    unpaid_records: 0,
                },
            })
        }
        const totalTax = taxRecords.reduce(
            (sum, record) => sum + record.amount,
            0
        )
        const paidTax = taxRecords
            .filter((r) => r.status === "lunas")
            .reduce((s, r) => s + r.amount, 0)
        const unpaidTax = totalTax - paidTax
        const totalRecords = taxRecords.length
        const paidRecords = taxRecords.filter(
            (r) => r.status === "lunas"
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil statistik",
        })
    }
}

async function propertyReport(req, res) {
    try {
        const { dateRange = "this_year" } = req.query
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
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            createdAt: { $gte: startDate, $lte: endDate },
        }).lean()
        const propertyGroups = {}
        taxRecords.forEach((record) => {
            const propertyType = record.tax_type || "Lainnya"
            if (!propertyGroups[propertyType]) {
                propertyGroups[propertyType] = { amount: 0, count: 0 }
            }
            propertyGroups[propertyType].amount += record.amount
            propertyGroups[propertyType].count += 1
        })
        const totalAmount = Object.values(propertyGroups).reduce(
            (sum, group) => sum + group.amount,
            0
        )
        const propertyData = Object.entries(propertyGroups).map(
            ([property, data]) => ({
                property,
                amount: data.amount,
                percentage:
                    totalAmount > 0
                        ? Math.round((data.amount / totalAmount) * 1000) / 10
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

async function outstanding(req, res) {
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data tunggakan",
        })
    }
}

async function byYear(req, res) {
    try {
        const year = parseInt(req.params.year)
        const taxRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            year,
        })
            .sort({ createdAt: -1 })
            .lean()
        const totalAmount = taxRecords.reduce(
            (sum, record) => sum + record.amount,
            0
        )
        const paidAmount = taxRecords
            .filter((r) => r.status === "lunas")
            .reduce((s, r) => s + r.amount, 0)
        const unpaidAmount = totalAmount - paidAmount
        res.json({
            success: true,
            message: `Data PBB tahun ${year} berhasil diambil`,
            data: taxRecords,
            summary: {
                year,
                totalRecords: taxRecords.length,
                totalAmount,
                paidAmount,
                unpaidAmount,
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
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat mengambil data PBB per tahun",
        })
    }
}

async function createTaxRecordsForNewYear(userId, newYear) {
    const previousYear = newYear - 1
    const existingRecords = await TaxRecord.find({
        user_id: userId,
        year: newYear,
    })
    if (existingRecords.length > 0) {
        return {
            success: true,
            message: `Data PBB untuk tahun ${newYear} sudah ada`,
            count: existingRecords.length,
        }
    }
    const previousRecords = await TaxRecord.find({
        user_id: userId,
        year: previousYear,
    }).sort({ createdAt: -1 })
    if (previousRecords.length === 0) {
        return {
            success: false,
            message: `Tidak ada data PBB tahun ${previousYear} untuk digunakan sebagai template`,
        }
    }
    const newRecords = []
    const outstandingRecords = []
    for (const prevRecord of previousRecords) {
        const isUnpaid =
            prevRecord.status === "belum_lunas" ||
            prevRecord.status === "proses"
        if (isUnpaid) {
            outstandingRecords.push({
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
            })
        }
        newRecords.push({
            user_id: userId,
            name: prevRecord.name,
            address: prevRecord.address,
            tax_type: "PBB",
            spt_number: `SPT-${newYear}-${String(
                newRecords.length + 1
            ).padStart(3, "0")}`,
            year: newYear,
            amount: Math.round(prevRecord.amount * 1.1),
            description: `Pajak Bumi dan Bangunan untuk ${
                prevRecord.description || "properti"
            } - Tahun ${newYear}`,
            status: "belum_lunas",
            due_date: new Date(`${newYear}-06-30`),
            payment_date: null,
            notes: `Data otomatis dibuat dari tahun ${previousYear}`,
        })
    }
    const createdRecords = await TaxRecord.insertMany([
        ...outstandingRecords,
        ...newRecords,
    ])
    return {
        success: true,
        message: `Berhasil membuat ${createdRecords.length} data PBB untuk tahun ${newYear}`,
        count: createdRecords.length,
        outstandingCount: outstandingRecords.length,
        newYearCount: newRecords.length,
        data: createdRecords,
    }
}

async function autoCreate(req, res) {
    try {
        const { year } = req.body
        const newYear = year || new Date().getFullYear()
        const result = await createTaxRecordsForNewYear(
            req.user.user_id,
            newYear
        )
        if (result.success) return res.json(result)
        return res.status(400).json(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat membuat data PBB otomatis",
        })
    }
}

async function checkYear(req, res) {
    try {
        const currentYear = new Date().getFullYear()
        const currentYearRecords = await TaxRecord.find({
            user_id: req.user.user_id,
            year: currentYear,
        })
        if (currentYearRecords.length === 0) {
            const result = await createTaxRecordsForNewYear(
                req.user.user_id,
                currentYear
            )
            return res.json({
                success: true,
                message: "Data PBB untuk tahun baru telah dibuat otomatis",
                autoCreated: true,
                ...result,
            })
        }
        return res.json({
            success: true,
            message: `Data PBB untuk tahun ${currentYear} sudah ada`,
            autoCreated: false,
            count: currentYearRecords.length,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat memeriksa data tahun",
        })
    }
}

module.exports = {
    list,
    create,
    getById,
    update,
    remove,
    statistics,
    propertyReport,
    outstanding,
    byYear,
    autoCreate,
    checkYear,
}
