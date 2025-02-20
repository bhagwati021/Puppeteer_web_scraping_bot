import puppeteer from 'puppeteer';
import fs from "fs";
import { Solver } from '@2captcha/captcha-solver'



(async ()=>{

    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({ headless: false }); //headless: true:does not open up the browser
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

     // Navigate to the Login Page
     await page.goto("https://stackoverflow.com/users/login", { waitUntil: "networkidle2" });

     // Enter Username & Password
     await page.type("#email", "bhagwati.excel2003@gmail.com", { delay: 100 });
     await page.type("#password", "Admin@9161", { delay: 100 });

    
    // Check if Captcha is Present
    const captchaSelector = ".g-recaptcha"; // Adjust selector based on site
    const captchaExists = await page.$(captchaSelector);
    

    if (captchaExists) {
        console.log("⚠️ Captcha detected! Solve it manually.");
        await page.waitForTimeout(20000); // Wait for manual solving (20 sec)
    }
    
    // Click the Login Button
    await page.click("#submit-button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });


    // Save Cookies After Login
    const cookies = await page.cookies();
    fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));
    console.log("✅ Saved login cookies!");

     // Navigate to Questions Page After Login
    await page.goto('https://stackoverflow.com/questions',{ waitUntil: "networkidle2" });
    // await page.waitForNavigation();
    // await page.waitFor(3000)


    // Extract the question, URL, and description
    const questions = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".s-post-summary")).map(post => ({
            question: post.querySelector("h3 a")?.innerText.trim(),
            url: post.querySelector("h3 a")?.href,
            description: post.querySelector(".s-post-summary--content-excerpt")?.innerText.trim()
        }));
    });

    console.log("Scraped Questions:", questions);



    await browser.close();

})();