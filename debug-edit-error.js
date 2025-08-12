const axios = require("axios")

const BASE_URL = "http://localhost:8000/api"

async function debugEditError() {
    try {
        console.log("🔍 Debugging Edit Tax Record Errors...\n")

        // Step 1: Check if server is running
        console.log("1️⃣ Checking server status...")
        try {
            const healthCheck = await axios.get(
                `${BASE_URL.replace("/api", "")}/health`
            )
            console.log("✅ Server is running")
        } catch (error) {
            console.error(
                "❌ Server is not running or health endpoint not available"
            )
            console.log("💡 Please start the server with: npm run dev")
            return
        }

        // Step 2: Login
        console.log("\n2️⃣ Testing login...")
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
        console.log(`🔑 Token: ${token.substring(0, 20)}...`)

        // Step 3: Check if user has tax records
        console.log("\n3️⃣ Checking user tax records...")
        const getAllResponse = await axios.get(`${BASE_URL}/tax-records`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!getAllResponse.data.success) {
            console.error(
                "❌ Failed to get tax records:",
                getAllResponse.data.message
            )
            return
        }

        const taxRecords = getAllResponse.data.data
        console.log(`📊 Found ${taxRecords.length} tax records`)

        if (taxRecords.length === 0) {
            console.error(
                "❌ No tax records found. Cannot test edit functionality."
            )
            console.log("💡 Please add some tax records first.")
            return
        }

        // Step 4: Test each record individually
        console.log("\n4️⃣ Testing each record for edit...")
        for (let i = 0; i < Math.min(3, taxRecords.length); i++) {
            const record = taxRecords[i]
            console.log(`\n📋 Testing record ${i + 1}:`)
            console.log(`   ID: ${record._id}`)
            console.log(`   Type: ${record.tax_type}`)
            console.log(`   SPT: ${record.spt_number}`)
            console.log(`   Amount: ${record.amount}`)

            try {
                // Test Get By ID
                const getByIdResponse = await axios.get(
                    `${BASE_URL}/tax-records/${record._id}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )

                if (getByIdResponse.data.success) {
                    console.log("   ✅ Get By ID: SUCCESS")
                } else {
                    console.log("   ❌ Get By ID: FAILED")
                    console.log(`      Error: ${getByIdResponse.data.message}`)
                }

                // Test Update with minimal data
                const updateData = {
                    tax_type: record.tax_type || "PBB",
                    spt_number: record.spt_number || "SPT-TEST",
                    amount: record.amount || 1000000,
                }

                const updateResponse = await axios.put(
                    `${BASE_URL}/tax-records/${record._id}`,
                    updateData,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                )

                if (updateResponse.data.success) {
                    console.log("   ✅ Update: SUCCESS")
                } else {
                    console.log("   ❌ Update: FAILED")
                    console.log(`      Error: ${updateResponse.data.message}`)
                }
            } catch (error) {
                console.log(`   ❌ Error testing record ${i + 1}:`)
                console.log(
                    `      ${error.response?.data?.message || error.message}`
                )
            }
        }

        // Step 5: Test with invalid ID
        console.log("\n5️⃣ Testing with invalid ID...")
        try {
            const invalidResponse = await axios.get(
                `${BASE_URL}/tax-records/invalid-id`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            )
            console.log("❌ Should have failed but succeeded")
        } catch (error) {
            if (error.response?.status === 404) {
                console.log("✅ Correctly failed with 404 for invalid ID")
            } else {
                console.log(
                    `❌ Unexpected error: ${error.response?.status} - ${error.response?.data?.message}`
                )
            }
        }

        console.log("\n🎉 Debug completed!")
    } catch (error) {
        console.error("❌ Debug failed:", error.response?.data || error.message)
        console.log("\n🔍 Error details:")
        console.log("Status:", error.response?.status)
        console.log("Data:", error.response?.data)
        console.log("Message:", error.message)
    }
}

debugEditError()
