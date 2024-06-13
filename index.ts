import crypto from "crypto"

const username = prompt("Enter username:")!.trim()
const password = prompt("Enter password:")!.trim()

const seed = crypto
    .createHash("md5")
    .update(username + username)
    .digest("hex")

const device_id = `android-${crypto
    .createHash("md5")
    .update(seed + "12345")
    .digest("hex").slice(0, 16)}`

const sign = (data: object) => `ig_sig_key_version=4&signed_body=${crypto
    .createHmac("SHA256", "99e16edcca71d7c1f3fd74d447f6281bd5253a623000a55ed0b60014467a53b1")
    .update(JSON.stringify(data))
    .digest("hex")}.${encodeURIComponent(JSON.stringify(data))}`

const instagram = (path: string, data: object) => fetch(`https://i.instagram.com/api/v1${path}/`, {
    method: "POST",
    headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Instagram 26.0.0.10.86 Android"
    },
    body: sign({
        ...data,
        username,
        password,
        device_id
    })
}).then(res => res.json())

let login = await instagram("/accounts/login", {
    phone_id: crypto.randomUUID(),
    guid: crypto.randomUUID()
})

if (login.status === "fail" && login.error_type !== "two_factor_required") {
    console.log(login.message)
    process.exit(1)
}

if (login.two_factor_required) {
    login = await instagram("/accounts/two_factor_login", {
        verification_code: parseInt(prompt("Enter 2FA code:")!),
        two_factor_identifier: login.two_factor_info.two_factor_identifier
    })
    if (login.status === "fail") {
        console.log(login.message)
        process.exit(1)
    }
}

console.clear()

await instagram(`/friendships/${login.logged_in_user.pk}/following`, {

})