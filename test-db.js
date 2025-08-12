const mongoose = require("mongoose")

const MONGODB_URI =
    "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin"

console.log("🔍 Testing MongoDB Connection...\n")
console.log("Connection string:", MONGODB_URI)
console.log("Database: exrejak\n")

// Test connection
mongoose
    .connect(MONGODB_URI)
    .then(async () => {
        console.log("✅ Connected to MongoDB successfully!")

        // List all collections
        const collections = await mongoose.connection.db
            .listCollections()
            .toArray()
        console.log("\n📋 Collections in database:")
        if (collections.length === 0) {
            console.log("   (No collections found)")
        } else {
            collections.forEach((collection) => {
                console.log(`   - ${collection.name}`)
            })
        }

        // Test creating a test document
        const TestSchema = new mongoose.Schema({
            test: String,
            timestamp: { type: Date, default: Date.now },
        })

        const Test = mongoose.model("Test", TestSchema)

        try {
            const testDoc = new Test({ test: "Connection test" })
            await testDoc.save()
            console.log("\n✅ Test document created successfully")

            // Clean up test document
            await Test.deleteOne({ test: "Connection test" })
            console.log("✅ Test document cleaned up")
        } catch (error) {
            console.error("❌ Error creating test document:", error.message)
        }

        console.log("\n🎉 Database connection test completed successfully!")
        process.exit(0)
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:")
        console.error("Error:", err.message)
        console.error("\n🔧 Troubleshooting:")
        console.error("1. Check if MongoDB server is running")
        console.error("2. Verify username and password")
        console.error("3. Check network connectivity")
        console.error('4. Ensure database "exrejak" exists')
        process.exit(1)
    })
