import puppeteer from 'puppeteer';
import fs from "fs";

export const scrapeQuora = async (searchQuery) => {
    console.log("🚀 Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    // Load Cookies if Available
    if (fs.existsSync("quora_cookies.json")) {
        const cookies = JSON.parse(fs.readFileSync("quora_cookies.json"));
        await page.setCookie(...cookies);
        console.log("✅ Loaded existing cookies!");
    }

    console.log("🔍 Navigating to Quora...");
    await page.goto(`https://www.quora.com/search?q=${encodeURIComponent(searchQuery)}`, { waitUntil: "networkidle2" });
    // Check if already logged in
    const isLoggedIn = await page.evaluate(() => {
        return document.querySelector(".q-text.qu-display--block") !== null; // Checks for profile section
    });

    if (!isLoggedIn) {
        console.log("🔑 Logging in to Quora...");
        await page.goto("https://www.quora.com/", { waitUntil: "networkidle2" });

        await page.type("input[type='email']", "bhagwati.excel2003@gmail.com", { delay: 100 });
        await page.type("input[type='password']", "Admin@9161", { delay: 100 });

        await page.click("button[type='button']");
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Save cookies after login
        const cookies = await page.cookies();
        fs.writeFileSync("quora_cookies.json", JSON.stringify(cookies, null, 2));
        console.log("✅ Login successful! Saved cookies.");
    } else {
        console.log("✅ Already logged in.");
    }

    console.log("📄 Scraping Quora home page...");
    const questions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".q-box.qu-mb--tiny a")).map(post => ({
            question: post.innerText.trim(),
            url: post.href
        }));
    });

    console.log("📌 Scraped Questions:", questions);

    fs.writeFile('quora_results.json', JSON.stringify(questions, null, 2));
    await browser.close();
    console.log("✅ Browser closed. Quora scraping completed.");


    return questions;
};
