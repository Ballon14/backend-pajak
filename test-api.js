const axios = require("axios")

const BASE_URL = "http://localhost:8000/api"

// Test data
const testUser = {
    email: "iqbaldev.site@gmail.com",
    password: "iqbaldev.site",
}

let authToken = ""

// Test functions
const testLogin = async () => {
    console.log("🔐 Testing login...")
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, testUser)
        console.log("✅ Login successful")
        console.log("User:", response.data.data.user.name)
        console.log("Token:", response.data.data.token.substring(0, 20) + "...")
        authToken = response.data.data.token
        return true
    } catch (error) {
        console.error("❌ Login failed:", error.response?.data || error.message)
        return false
    }
}

const testStatistics = async () => {
    console.log("\n📊 Testing statistics endpoint...")
    try {
        const response = await axios.get(`${BASE_URL}/tax-records/statistics`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })
        console.log("✅ Statistics successful")
        console.log("Response:", JSON.stringify(response.data, null, 2))
        return true
    } catch (error) {
        console.error(
            "❌ Statistics failed:",
            error.response?.data || error.message
        )
        return false
    }
}

const testTaxRecords = async () => {
    console.log("\n📋 Testing tax records endpoint...")
    try {
        const response = await axios.get(`${BASE_URL}/tax-records`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })
        console.log("✅ Tax records successful")
        console.log("Total records:", response.data.data.length)
        return true
    } catch (error) {
        console.error(
            "❌ Tax records failed:",
            error.response?.data || error.message
        )
        return false
    }
}

const testUserInfo = async () => {
    console.log("\n👤 Testing user info endpoint...")
    try {
        const response = await axios.get(`${BASE_URL}/auth/user`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        })
        console.log("✅ User info successful")
        console.log("User:", response.data.data.name)
        console.log("Email:", response.data.data.email)
        return true
    } catch (error) {
        console.error(
            "❌ User info failed:",
            error.response?.data || error.message
        )
        return false
    }
}

// Main test function
const runTests = async () => {
    console.log("🚀 Starting API tests...\n")

    const loginSuccess = await testLogin()
    if (!loginSuccess) {
        console.log("\n❌ Cannot continue without login")
        return
    }

    await testUserInfo()
    await testStatistics()
    await testTaxRecords()

    console.log("\n✅ All tests completed!")
}

// Run tests
runTests().catch(console.error)
