const mongoose = require("mongoose")

console.log("🔧 MongoDB Troubleshooting Guide\n")

console.log("📋 Common Issues and Solutions:\n")

console.log("1. 🔐 Authentication Issues:")
console.log('   - Check if username "iqbal" exists in MongoDB')
console.log('   - Verify password "iqbal" is correct')
console.log('   - Ensure user has access to database "relajak"')
console.log("   - Try different authSource: admin, relajak, or none\n")

console.log("2. 🌐 Network Issues:")
console.log("   - Check if MongoDB server is running on 100.64.75.107:27017")
console.log("   - Verify network connectivity to the server")
console.log("   - Check firewall settings")
console.log("   - Try ping: ping 100.64.75.107\n")

console.log("3. 🗄️ Database Issues:")
console.log('   - Check if database "relajak" exists')
console.log("   - Verify user permissions on the database")
console.log("   - Try connecting without authentication first\n")

console.log("4. 🔧 Connection String Variations to Try:")
console.log("   mongodb://iqbal:iqbal@100.64.75.107:27017/relajak")
console.log(
    "   mongodb://iqbal:iqbal@100.64.75.107:27017/relajak?authSource=admin"
)
console.log(
    "   mongodb://iqbal:iqbal@100.64.75.107:27017/relajak?authSource=relajak"
)
console.log("   mongodb://100.64.75.107:27017/relajak (no auth)")
console.log("   mongodb://iqbal:iqbal@100.64.75.107:27017 (no database)\n")

console.log("5. 🛠️ Manual MongoDB Commands to Check:")
console.log("   # Connect to MongoDB shell")
console.log("   mongo 100.64.75.107:27017")
console.log("   # Or with authentication")
console.log("   mongo 100.64.75.107:27017/relajak -u iqbal -p iqbal")
console.log("   # List databases")
console.log("   show dbs")
console.log("   # List users")
console.log("   use admin")
console.log("   db.getUsers()")
console.log("   # Check user permissions")
console.log("   use relajak")
console.log("   db.getUsers()\n")

console.log("6. 🧪 Test Commands:")
console.log("   npm run test-auth  # Test different auth methods")
console.log("   npm run test-db    # Test basic connection")
console.log("   npm test           # Test API endpoints\n")

console.log("7. 📞 Contact Information:")
console.log("   - MongoDB Server: 100.64.75.107:27017")
console.log("   - Database: relajak")
console.log("   - Username: iqbal")
console.log("   - Password: iqbal\n")

console.log("🚀 Run these commands to test:")
console.log("   npm run test-auth")
console.log("   npm run test-db")
console.log("   npm test")
