const fs = require("fs")
const path = require("path")

console.log("🚀 Setting up PajakApp Backend (Express.js)...\n")

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, ".env")
if (!fs.existsSync(envPath)) {
    const envContent = `PORT=8000
MONGODB_URI=mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development`

    fs.writeFileSync(envPath, envContent)
    console.log("✅ Created .env file")
} else {
    console.log("✅ .env file already exists")
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, "node_modules")
if (!fs.existsSync(nodeModulesPath)) {
    console.log("📦 Installing dependencies...")
    console.log("Run: npm install")
} else {
    console.log("✅ Dependencies already installed")
}

console.log("\n📋 Setup Instructions:")
console.log("1. Install dependencies: npm install")
console.log(
    "2. MongoDB connection: mongodb://iqbal:iqbal@100.64.75.107:27017/exrejak?authSource=admin"
)
console.log("3. Database: exrejak")
console.log("4. Run server: npm run dev")
console.log("5. Test API: npm test")
console.log("\n🎯 Default user:")
console.log("   Email: iqbaldev.site@gmail.com")
console.log("   Password: iqbaldev.site")
console.log("\n📊 API will be available at: http://localhost:8000/api")
console.log("\n✅ Setup complete!")
