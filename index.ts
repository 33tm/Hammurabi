import { createHash, createHmac } from "crypto"

const username = prompt("Enter username:")!.trim()
const password = prompt("Enter password:")!.trim()

const seed = createHash("md5")
    .update(username + username)
    .digest("hex")

const device_id = `android-${createHash("md5")
    .update(seed + "12345")
    .digest("hex")
    .slice(0, 16)}`

const sign = (data: object) => {
    const body = createHmac("sha256", "46024e8f31e295869a0e861eaed42cb1dd8454b55232d85f6c6764365079374b")
        .update(JSON.stringify(data))
        .digest("hex")
    return `ig_sig_key_version=4&signed_body=${body}.${encodeURIComponent(JSON.stringify(data))}`
}

const instagram = async (method: "GET" | "POST", path: string, data?: object) => {
    return await fetch(`https://i.instagram.com/api/v1${path}`, {
        method,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Instagram 26.0.0.10.86 Android"
        },
        ...(method === "POST" && {
            body: sign({
                ...data,
                username,
                password,
                device_id
            })
        })
    }).then(res => res.json())
}

let login = await instagram("POST", "/accounts/login/", {
    phone_id: crypto.randomUUID(),
    guid: crypto.randomUUID()
})

if (login.status === "fail" && login.error_type !== "two_factor_required") {
    console.log(login.message)
    process.exit(1)
}

if (login.two_factor_required) {
    login = await instagram("POST", "/accounts/two_factor_login/", {
        verification_code: parseInt(prompt("Enter 2FA code:")!),
        two_factor_identifier: login.two_factor_info.two_factor_identifier
    })
    if (login.status === "fail") {
        console.log(login.message)
        process.exit(1)
    }
}

console.clear()