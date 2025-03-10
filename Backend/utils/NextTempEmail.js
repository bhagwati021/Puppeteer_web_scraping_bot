// import puppeteer from "puppeteer";
import puppeteer from 'puppeteer-extra';
import { Metadata } from '../models/MetadataModel.js';
import { Credential} from "../models/CredentialModel.js";
import { Response } from '../models/ResponseModel.js';
import * as cheerio from 'cheerio';
import { logger } from '../logs/logger.js';


// Proxy setup



// Function to get the next available temp email in round-robin fashion
export const getNextTempEmail = async (site) => {

    const accounts = await Credential.find({site});         //only have one accunt for now

    console.log(accounts.length);
    if (accounts.length === 0) throw new Error("No temporary accounts found in DB!");

    // Use round-robin approach
    const lastUsedIndex = (await Metadata.findOne({ key: "lastUsedIndex" })) || { value: -1 };
    const nextIndex = (lastUsedIndex.value + 1) % accounts.length;

    // Update last used index in DB
    await Metadata.updateOne({ key: "lastUsedIndex" }, { value: nextIndex }, { upsert: true });

    return accounts[nextIndex];
};

// Function to scrape answers from Stack Overflow
export const StackOverflowScrapeAnswers = async (query) => {

    const site = "https://stackoverflow.com/";
    const account = await getNextTempEmail(site);
    if (!account) throw new Error("No valid user account found!");

    logger.info(`🔄 Using account: ${account.email} for scraping`);

  /*   const proxies = [
        'http://219.65.73.81:80',
        'http://68.183.143.134:80',
        'http://63.143.57.119:80',
      ];

    for (let i = 0; i < 5; i++) 
        const proxy = proxies[Math.floor(Math.random() * proxies.length)];
     */
    const browser = await puppeteer.launch({  
        headless: false,
        userDataDir: "./user_data", 
        args: ["--no-sandbox", "--disable-setuid-sandbox",] });

    const page = await browser.newPage();
     
    // Set User-Agent and viewport
     await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
     await page.setViewport({ width: 1280, height: 800 });
    
   
    // Step 1: Search for the question
    logger.info(`🔍 Searching Stack Overflow for: ${query.text}`);
    await page.goto(`https://stackoverflow.com/`, { waitUntil: "networkidle2" });

    // Step 2: Apply stored cookies from the retrieved account
    if (account.cookies && account.cookies.length > 0) {
        logger.info("🍪 Applying stored cookies for authentication...");
        await page.setCookie(...account.cookies);
    } else {
        logger.info("⚠️ No valid cookies found! You might need to log in manually first.");
        await browser.close();
        return null;
    }

    // Step 3: Handle CSRF Token
    const getCSRFToken = async (page) => {
        const csrfToken = await page.evaluate(() => {
            return document.querySelector('input[name="fkey"]')?.value;
        });
        return csrfToken;
    };

    const csrfToken = await getCSRFToken(page);
    logger.info("🔑 CSRF Token:", csrfToken);

    // Step 4: Type the search query
    const searchSelector = 'input[name="q"]';
    await page.waitForSelector(searchSelector); // Ensure search box is loaded
    await page.type(searchSelector, query.text); // Type query
    await page.keyboard.press('Enter'); // Press Enter to search

    
    // Step 5: Wait for you to manually solve CAPTCHA
    logger.info("⚠️ Please solve the CAPTCHA manually. Waiting for 30 seconds...");
    await new Promise(resolve => setTimeout(resolve, 50000));
    logger.info("✅ Continuing after CAPTCHA...");


    // Step 6: Get the first search result link
    const questionLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll(".s-post-summary--content h3 a")).map(el => el.href);
        return links;
    });
    logger.info(`Total no of search result found(Stack):${questionLinks}`);
   
    
    const selectedLinks = [];
    const positions = [0,1,2,3,4]; 

    //step 7: visiting the child link or the question url
    for (const pos of positions) {
        if (questionLinks[pos]) {
            selectedLinks.push(questionLinks[pos]);
            if (selectedLinks.length >= 5) break;  // Stop after collecting 5 links
        }
    }
    if (selectedLinks.length === 0) {
        logger.warn("❌ No valid question links found in specified positions.");
        await browser.close();
        return null;
    }
    logger.info(`✅ Selected ${selectedLinks.length} question links from Quora.`);

    const responses = [];
    
    for (const questionUrl of selectedLinks) {
    logger.info(`🔗 Visiting question page: ${questionUrl}`);
    await page.goto(questionUrl, { waitUntil: "networkidle2" });

    // Step 8: Extract page content
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);

    // Step 9: Scrape the first answer
    let firstAnswer = $(".answercell .s-prose").first().text().trim();

    if (!firstAnswer) {
        logger.info("❌ No answer found! Trying fallback selector...");
        firstAnswer = $(".answer").first().text().trim();
    }
    if (!firstAnswer) {
        logger.error("🚨 No answer found even with fallback selector. Exiting.");
        await browser.close();
        return null;
    }

    logger.info(`📄 First answer extracted(stack)`);
    console.log("📄 First answer extracted:", firstAnswer);

    // Step 10: Store in MongoDB
    const responseEntry = new Response({
        questionId: query._id,
        source: "Stack Overflow",
        content: firstAnswer,
        url: questionUrl,
    });

    await responseEntry.save();
    logger.info("💾 Summarized answer saved to database!");
    }
    await browser.close();
    return responses;
};

