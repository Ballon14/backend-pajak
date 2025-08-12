import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
    stages: [
        { duration: "30s", target: 100 }, // ramp up
        { duration: "2m", target: 300 }, // sustain
        { duration: "30s", target: 0 }, // ramp down
    ],
    thresholds: {
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(95)<1000", "p(99)<2000"],
    },
}

const BASE_URL = __ENV.BASE_URL || "http://localhost:8000"
const EMAIL = __ENV.EMAIL || "iqbaldev.site@gmail.com"
const PASSWORD = __ENV.PASSWORD || "iqbaldev.site"

export function setup() {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/login`,
        JSON.stringify({
            email: EMAIL,
            password: PASSWORD,
        }),
        {
            headers: { "Content-Type": "application/json" },
            timeout: "30s",
        }
    )

    check(loginRes, {
        "login status 200": (r) => r.status === 200,
        "login has token": (r) => !!r.json("data.token"),
    })

    const token = loginRes.json("data.token")
    return { token }
}

export default function (data) {
    const headers = { Authorization: `Bearer ${data.token}` }

    // Use a mix of endpoints
    const responses = http.batch([
        ["GET", `${BASE_URL}/api/tax-records`, null, { headers }],
        ["GET", `${BASE_URL}/api/tax-records/statistics`, null, { headers }],
        [
            "GET",
            `${BASE_URL}/api/reports/property?dateRange=this_year`,
            null,
            { headers },
        ],
    ])

    check(responses[0], { "list 200": (r) => r.status === 200 })
    check(responses[1], { "stats 200": (r) => r.status === 200 })
    check(responses[2], { "property 200": (r) => r.status === 200 })

    sleep(1)
}
