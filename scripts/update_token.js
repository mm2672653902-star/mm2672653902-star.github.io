const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function encryptToken(token, username, password) {
    const pin = `${username}:${password}`;
    const enc = new TextEncoder();

    // 1. Generate salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    // 2. Derive key material from PIN (username:password)
    const keyMaterial = await crypto.webcrypto.subtle.importKey(
        "raw",
        enc.encode(pin),
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"]
    );

    // 3. Derive AES-GCM 256 key
    const key = await crypto.webcrypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    // 4. Encrypt the token
    const encryptedBuffer = await crypto.webcrypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        key,
        enc.encode(token)
    );

    // 5. Extract ciphertext and auth tag (last 16 bytes for GCM)
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertextBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);
    const authTagBytes = encryptedBytes.slice(encryptedBytes.length - 16);

    return {
        salt: bytesToHex(salt),
        iv: bytesToHex(iv),
        ciphertext: bytesToHex(ciphertextBytes),
        authTag: bytesToHex(authTagBytes)
    };
}

async function main() {
    console.log("=================================================");
    console.log("   小毛的blog空间 - GitHub Token 加密更新工具   ");
    console.log("=================================================");

    const token = (await question("请输入新的 GitHub Token (以 ghp_ 开头): ")).trim();
    if (!token.startsWith("ghp_")) {
        console.error("错误: Token 必须以 'ghp_' 开头！");
        rl.close();
        return;
    }

    const username = (await question("请输入你的后台管理账号: ")).trim();
    const password = await question("请输入你的后台管理密码: ");

    if (!username || !password) {
        console.error("错误: 账号和密码不能为空！");
        rl.close();
        return;
    }

    console.log("\n正在进行本地加密...");
    try {
        const config = await encryptToken(token, username, password);

        // Update env.txt as well
        const envPath = path.join(__dirname, '../env.txt');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/GITHUB_TOKEN=ghp_[a-zA-Z0-9_]+/g, `GITHUB_TOKEN=${token}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log("✓ 本地 env.txt 已成功更新新的 Token！");
        }

        // Update source/admin/index.html
        const adminPath = path.join(__dirname, '../source/admin/index.html');
        if (fs.existsSync(adminPath)) {
            let adminHtml = fs.readFileSync(adminPath, 'utf8');

            const regex = /const CRYPTO_CONFIG = \{[\s\S]*?\};/;
            const newConfigStr = `const CRYPTO_CONFIG = {
            salt: "${config.salt}",
            iv: "${config.iv}",
            ciphertext: "${config.ciphertext}",
            authTag: "${config.authTag}"
        };`;

            if (regex.test(adminHtml)) {
                adminHtml = adminHtml.replace(regex, newConfigStr);
                fs.writeFileSync(adminPath, adminHtml, 'utf8');
                console.log("✓ 网页后台 source/admin/index.html 中的 CRYPTO_CONFIG 已成功加密替换！");
            } else {
                console.warn("⚠️ 未能在 index.html 中定位到 CRYPTO_CONFIG，请手动更新。");
            }
        }

        console.log("\n更新完成！请运行以下命令将更新部署到云端：");
        console.log("  git add .");
        console.log("  git commit -m \"chore: 更新 GitHub Token\"");
        console.log("  git push origin source");
    } catch (e) {
        console.error("加密过程中出现错误:", e);
    }

    rl.close();
}

main();
