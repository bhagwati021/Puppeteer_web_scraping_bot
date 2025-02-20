import puppeteer from 'puppeteer';
import fs from "fs";

const log = (message, type = "info") => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type.toUpperCase()}]: ${message}`);
};

(async () => {
    log("🚀 Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    // Load Cookies if Available
    if (fs.existsSync("quora_cookies.json")) {
        const cookies = JSON.parse(fs.readFileSync("quora_cookies.json"));
        await page.setCookie(...cookies);
        log("✅ Loaded existing cookies!");
    }

    log("🔍 Navigating to Quora...");
    await page.goto("https://www.quora.com/", { waitUntil: "networkidle2" });

    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
        return document.querySelector(".q-text.qu-display--block") !== null; // Checks for profile section
    });

    if (!isLoggedIn) {
        log("🔑 Logging in to Quora...");
        await page.goto("https://www.quora.com/", { waitUntil: "networkidle2" });

        await page.type("input[type='email']", "bhagwati.excel2003@gmail.com", { delay: 100 });
        await page.type("input[type='password']", "Admin@9161", { delay: 100 });

        await page.click("button[type='button']");
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Save cookies after login
        const cookies = await page.cookies();
        fs.writeFileSync("quora_cookies.json", JSON.stringify(cookies, null, 2));
        log("✅ Login successful! Saved cookies.");
    } else {
        log("✅ Already logged in.");
    }

    log("📄 Scraping Quora home page...");
    const questions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".q-box.qu-mb--tiny a")).map(post => ({
            question: post.innerText.trim(),
            url: post.href
        }));
    });

    console.log("📌 Scraped Questions:", questions);

    await browser.close();
    log("✅ Browser closed. Quora scraping completed.");
})();
