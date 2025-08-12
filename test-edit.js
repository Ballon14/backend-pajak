const axios = require("axios")

const BASE_URL = "http://localhost:8000/api"

async function testEditTaxRecord() {
    try {
        console.log("🧪 Testing Edit Tax Record Endpoints...\n")

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
        console.log("✅ Login successful")
        console.log(`🔑 Token: ${token.substring(0, 20)}...\n`)

        // Step 2: Get all tax records to find an ID
        console.log("2️⃣ Getting all tax records...")
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
        if (taxRecords.length === 0) {
            console.error("❌ No tax records found to test edit")
            return
        }

        const testRecordId = taxRecords[0]._id
        console.log(`✅ Found tax record with ID: ${testRecordId}\n`)

        // Step 3: Test Get By ID
        console.log("3️⃣ Testing Get By ID...")
        const getByIdResponse = await axios.get(
            `${BASE_URL}/tax-records/${testRecordId}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        if (getByIdResponse.data.success) {
            console.log("✅ Get By ID successful")
            console.log("📋 Record data:", getByIdResponse.data.data)
        } else {
            console.error("❌ Get By ID failed:", getByIdResponse.data.message)
        }
        console.log("")

        // Step 4: Test Update
        console.log("4️⃣ Testing Update...")
        const updateData = {
            tax_type: "PBB",
            spt_number: "SPT-TEST-2024",
            period: "Januari-Juni",
            year: "2024",
            amount: 3000000,
            description: "Test update description",
            status: "lunas",
            due_date: "2024-06-30",
            payment_date: "2024-06-15",
            notes: "Test update notes",
        }

        const updateResponse = await axios.put(
            `${BASE_URL}/tax-records/${testRecordId}`,
            updateData,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        )

        if (updateResponse.data.success) {
            console.log("✅ Update successful")
            console.log("📋 Updated record:", updateResponse.data.data)
        } else {
            console.error("❌ Update failed:", updateResponse.data.message)
        }
        console.log("")

        console.log("🎉 All edit tests completed!")
    } catch (error) {
        console.error("❌ Test failed:", error.response?.data || error.message)
    }
}

testEditTaxRecord()
