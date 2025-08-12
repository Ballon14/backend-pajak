const axios = require("axios")

const BASE_URL = "http://localhost:8000/api"

async function testReports() {
    try {
        console.log("🧪 Testing Reports Endpoints...\n")

        // Step 1: Login to get token
        console.log("1️⃣ Logging in...")
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: "iqbaldev.site@gmail.com",
            password: "iqbaldev.site",
        })

        if (!loginResponse.data.success) {
            console.error("❌ Login failed:", loginResponse.data.message)
            return
        }

        const token = loginResponse.data.data.token
        const userId = loginResponse.data.data.user.id
        console.log("✅ Login successful")
        console.log(`👤 User ID: ${userId}`)
        console.log(`🔑 Token: ${token.substring(0, 20)}...\n`)

        // Step 2: Test Summary Report
        console.log("2️⃣ Testing Summary Report...")
        const summaryResponse = await axios.get(
            `${BASE_URL}/reports/summary?dateRange=this_year`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        if (summaryResponse.data.success) {
            console.log("✅ Summary report successful")
            console.log("📊 Summary Data:", summaryResponse.data.data)
        } else {
            console.error(
                "❌ Summary report failed:",
                summaryResponse.data.message
            )
        }
        console.log("")

        // Step 3: Test Property Report
        console.log("3️⃣ Testing Property Report...")
        const propertyResponse = await axios.get(
            `${BASE_URL}/reports/property?dateRange=this_year`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        if (propertyResponse.data.success) {
            console.log("✅ Property report successful")
            console.log("🏠 Property Data:", propertyResponse.data.data)
        } else {
            console.error(
                "❌ Property report failed:",
                propertyResponse.data.message
            )
        }
        console.log("")

        console.log("🎉 All reports tests completed!")
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message)
    }
}

testReports()
