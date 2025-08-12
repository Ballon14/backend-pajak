const mongoose = require("mongoose")

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

// Performance indexes for common queries
taxRecordSchema.index({ user_id: 1, createdAt: -1 })
taxRecordSchema.index({ user_id: 1, year: -1, createdAt: -1 })
taxRecordSchema.index({ user_id: 1, status: 1, createdAt: -1 })
taxRecordSchema.index({ spt_number: 1 })

module.exports =
    mongoose.models.TaxRecord || mongoose.model("TaxRecord", taxRecordSchema)
