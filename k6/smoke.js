import http from "k6/http"
import { check, sleep } from "k6"

export const options = {
    vus: 10,
    duration: "30s",
    thresholds: {
        http_req_failed: ["rate<0.01"], // <1% errors
        http_req_duration: ["p(95)<800"], // 95% requests < 800ms
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

    const res = http.batch([
        ["GET", `${BASE_URL}/api/tax-records`, null, { headers }],
        ["GET", `${BASE_URL}/api/tax-records/statistics`, null, { headers }],
        [
            "GET",
            `${BASE_URL}/api/reports/summary?dateRange=this_year`,
            null,
            { headers },
        ],
    ])

    check(res[0], { "list 200": (r) => r.status === 200 })
    check(res[1], { "stats 200": (r) => r.status === 200 })
    check(res[2], { "summary 200": (r) => r.status === 200 })

    sleep(1)
}
