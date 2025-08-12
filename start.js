const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🚀 Starting PajakApp Backend (Express.js)...\n")

// Check if .env exists
const envPath = path.join(__dirname, ".env")
if (!fs.existsSync(envPath)) {
    console.log("📝 Creating .env file...")
    const setup = spawn("node", ["setup.js"], { stdio: "inherit" })
    setup.on("close", (code) => {
        if (code === 0) {
            startServer()
        }
    })
} else {
    startServer()
}

function startServer() {
    console.log("🔧 Checking dependencies...")

    // Check if node_modules exists
    const nodeModulesPath = path.join(__dirname, "node_modules")
    if (!fs.existsSync(nodeModulesPath)) {
        console.log("📦 Installing dependencies...")
        const install = spawn("npm", ["install"], { stdio: "inherit" })
        install.on("close", (code) => {
            if (code === 0) {
                console.log("✅ Dependencies installed successfully")
                runServer()
            } else {
                console.error("❌ Failed to install dependencies")
            }
        })
    } else {
        console.log("✅ Dependencies already installed")
        runServer()
    }
}

function runServer() {
    console.log("🚀 Starting server...")
    console.log("📊 API will be available at: http://localhost:8000/api")
    console.log("🎯 Default user: iqbaldev.site@gmail.com / iqbaldev.site")
    console.log("⏹️  Press Ctrl+C to stop\n")

    const server = spawn("npm", ["run", "dev"], { stdio: "inherit" })

    server.on("close", (code) => {
        console.log(`\n🛑 Server stopped with code ${code}`)
    })

    // Handle process termination
    process.on("SIGINT", () => {
        console.log("\n🛑 Stopping server...")
        server.kill("SIGINT")
    })
}
