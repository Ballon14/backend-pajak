const mongoose = require("mongoose")

console.log("🔍 Testing MongoDB Authentication...\n")

// Test different connection strings
const connectionStrings = [
    {
        name: "With Database in URI",
        uri: "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak",
    },
    {
        name: "Without Database in URI",
        uri: "mongodb://iqbal:iqbal@100.64.75.107:27017",
    },
    {
        name: "With Auth Database (admin)",
        uri: "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin",
    },
    {
        name: "With Auth Database (exrejak)",
        uri: "mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=exrejak",
    },
    {
        name: "Without Authentication",
        uri: "mongodb://100.64.75.107:27017/exrejak",
    },
]

async function testConnection(connectionString, name) {
    console.log(`\n🔍 Testing: ${name}`)
    console.log(`URI: ${connectionString}`)

    try {
        await mongoose.connect(connectionString, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        })

        console.log("✅ Connection successful!")

        // List databases
        const adminDb = mongoose.connection.db.admin()
        const dbs = await adminDb.listDatabases()
        console.log("📋 Available databases:")
        dbs.databases.forEach((db) => {
            console.log(`   - ${db.name}`)
        })

        // List collections in exrejak database
        try {
            const collections = await mongoose.connection.db
                .listCollections()
                .toArray()
            console.log("📋 Collections in current database:")
            if (collections.length === 0) {
                console.log("   (No collections found)")
            } else {
                collections.forEach((collection) => {
                    console.log(`   - ${collection.name}`)
                })
            }
        } catch (error) {
            console.log("❌ Cannot list collections:", error.message)
        }

        await mongoose.disconnect()
        return true
    } catch (error) {
        console.log("❌ Connection failed:", error.message)
        return false
    }
}

async function runTests() {
    console.log("🚀 Starting authentication tests...\n")

    for (const test of connectionStrings) {
        const success = await testConnection(test.uri, test.name)
        if (success) {
            console.log(`\n🎉 Found working connection: ${test.name}`)
            console.log(`Use this URI: ${test.uri}`)
            break
        }
    }

    console.log("\n📋 Summary:")
    console.log("If all tests failed, check:")
    console.log("1. MongoDB server is running on 100.64.75.107:27017")
    console.log('2. Username "iqbal" exists in MongoDB')
    console.log('3. Password "iqbal" is correct')
    console.log('4. User has access to database "exrejak"')
    console.log("5. Network connectivity to the server")
}

runTests().catch(console.error)
