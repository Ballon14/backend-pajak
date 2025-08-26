const app = require("./app")
const { port } = require("./config/env")
const { connectToDatabase } = require("./config/db")
const { seedData } = require("./utils/seed")

async function start() {
    await connectToDatabase()
    await seedData()

    app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`)
        console.log(`📊 API available at http://localhost:${port}/api`)
    })
}

start().catch((err) => {
    console.error("Failed to start server:", err)
    process.exit(1)
})
