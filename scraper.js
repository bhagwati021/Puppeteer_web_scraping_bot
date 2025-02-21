import puppeteer from "puppeteer";
import { Credential,Response } from "./models/models.js";

export const loginToSite = async (site, email, Password) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    await page.goto(site, { waitUntil: "networkidle2" });
  
    await page.type("input[type='email']", email);
    await page.type("input[type='password']", Password);
    await page.click("div.q-flex.qu-justifyContent--space-between.qu-alignItems--center > button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });
  
    const cookies = await page.cookies();
    
    await browser.close();
  
    // Save credentials securely
    const existingCredential = await Credential.findOne({ site });
    if (!existingCredential) {
      await Credential.create({
        site,
        email,
        Password, // Ensure hashing
        cookies,
      });
    }
  
    return { cookies};
  };

  export const QuorascrapeAnswers = async (query) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
  
    const credentials = await Credential.findOne({ site: "https://www.quora.com/" });
    if (!credentials) throw new Error("No credentials found!");
  
    await page.setCookie(...credentials.cookies);
    await page.goto(`https://www.quora.com/`, { waitUntil: "networkidle2" });
  
    console.log("📄 Scraping Quora home page...");
    const answers = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".q-box.qu-mb--tiny a")).map(post => ({
            question: post.innerText.trim(),
            url: post.href
        }));
    });

    console.log("📌 Scraped Questions:", answers);
  
    await browser.close();
  
    // Save to MongoDB
    answers.forEach(async (answer) => {
      await Response.create({ questionId: query._id, source: "Quora", content: answer.question ,url: answer.url});
    });
  
    return answers;
  };
  
