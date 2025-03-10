import puppeteer from 'puppeteer';
import fs from "fs";

export const scrapeStackOverflow = async (searchQuery) => {
    console.log("🚀 Launching Puppeteer browser...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Set User-Agent and viewport
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    // Load Cookies if Available
    if (fs.existsSync("cookies.json")) {
        const cookies = JSON.parse(fs.readFileSync("cookies.json"));
        await page.setCookie(...cookies);
        console.log("✅ Loaded existing cookies!");
    }

    // Navigate to StackOverflow Questions page to check login status
    console.log("🔍 Checking login status...");
    await page.goto("https://stackoverflow.com/questions", { waitUntil: "networkidle2" });

    // Check if user is already logged in
    const isLoggedIn = await page.evaluate(() => {
        return document.querySelector(".my-profile") !== null; // Check for profile icon
    });

    if (!isLoggedIn) {
        console.log("🔑 Not logged in. Proceeding with login...");
        
        // Navigate to login page
        await page.goto("https://stackoverflow.com/users/login", { waitUntil: "networkidle2" });

        // Enter Username & Password
        await page.type("#email", "bhagwati.excel2003@gmail.com", { delay: 100 });
        await page.type("#password", "Admin@9161", { delay: 100 });

        // Click the Login Button
        await page.click("#submit-button");
        await page.waitForNavigation({ waitUntil: "networkidle2" });

        // Save Cookies After Login
        const cookies = await page.cookies();
        fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
        console.log("✅ Login successful! Saved session cookies.");
    } else {
        console.log("✅ Already logged in. Skipping login process.");
    }

    // Navigate to Questions Page After Login
    console.log("📄 Navigating to StackOverflow questions page...");
    await page.goto(`https://stackoverflow.com/search?q=${encodeURIComponent(searchQuery)}`, { waitUntil: "networkidle2" });

    // Extract the question, URL, and description
    console.log("🔍 Extracting questions...");
    const questions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".s-post-summary")).map(post => ({
            question: post.querySelector("h3 a")?.innerText.trim(),
            url: post.querySelector("h3 a")?.href,
            description: post.querySelector(".s-post-summary--content-excerpt")?.innerText.trim()
        }));
    });

    if (questions.length > 0) {
        console.log(`✅ Successfully scraped ${questions.length} questions.`);
    } else {
        console.log("⚠️ No questions found. The page structure may have changed.", "warning");
    }

    console.log("📌 Scraped Questions:", questions);

    console.log("🛑 Writing result to stackoverflow_results.json...");
    await fs.writeFile('stackoverflow_results.json', JSON.stringify(questions, null, 2));
    await browser.close();
    console.log("✅ Browser closed. Script completed.");
    return questions;
};
