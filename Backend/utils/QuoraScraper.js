import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import { logger } from '../logs/logger.js';
import { Credential} from "../models/CredentialModel.js";
import { Response } from '../models/ResponseModel.js';


//Scraping the answer from Quora
export const QuoraScrapeAnswers = async (query) => {
    
    logger.info("Starting Puppeteer browser for Quora...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Load stored cookies for authentication
    logger.info("loading the cookies into Quora...");
    const credentials = await Credential.findOne({ site: "https://www.quora.com/" });
    if (!credentials) throw new Error("No credentials found!");
    await page.setCookie(...credentials.cookies);

    // Step 0: Search for the question
    logger.info(`🔍 Searching Quora for: ${query.text}`);
    await page.goto("https://www.quora.com/", { waitUntil: "networkidle2" });
    await page.type("input[placeholder='Search Quora']", query.text);

    // Step 1: Click the first search result
    const firstResultSelector = "div[role='option']";
    await page.waitForSelector(firstResultSelector, { visible: true });
    await page.click(firstResultSelector);
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Step 2: Get the all the search result link
    const questionLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("#mainContent > div > div > div:nth-child(2) > div > span > a")).map(el => el.href);           // Get the first 5 question URLs
        return links;
    });

    logger.info(`Total no of search result found(Quora):${questionLinks}`);

    const selectedLinks = [];
    const positions = [0,1,2,3,4];  // Adjust based on availability

    // visiting the child link or the question url
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
    logger.info(`🔗 Visiting Quora question page: ${questionUrl}`);
    await page.goto(questionUrl, { waitUntil: "networkidle2" });

    // Step 3: Get the page content
    const pageContent = await page.content();

    // Step 4: Use Cheerio to parse the HTML and extract the answer
    const $ = cheerio.load(pageContent);

    // Step 5: Scrape the first answer
    let firstAnswer = $(".q-box.spacing_log_answer_content.puppeteer_test_answer_content > div > div > div")
        .first()
        .text()
        .trim();

    // Step 6:Falback mechanism for scraping the answers
    if (!firstAnswer) {
        logger.warn("❌ No answer found! Retrying with alternative selector...");

        // Try a different selector if first attempt fails
        firstAnswer = await page.evaluate(() => {
            const altAnswerContainer = document.querySelector(".q-text > span > span");
            return altAnswerContainer ? altAnswerContainer.innerText.trim() : null;
        });
    
        if (!firstAnswer) {
            console.log("🚨 No answer found even with fallback selector. Exiting.");
            await browser.close();
            return null;
        }

        logger.info(`✅ Found answer using fallback selector:${firstAnswer}`);
    
    }

    console.log("📄 First answer extracted(Quora):", firstAnswer);
    logger.info(`📄 First answer extracted(Quora)`);

    // Step 8: Store the summarized answer in MongoDB
    const responseEntry = new Response({
        questionId: query._id,
        source: "Quora",
        content: firstAnswer,
        url: questionUrl,
    });

    await responseEntry.save();

    responses.push(responseEntry);
    logger.info(`💾Answer saved to database`);
}

    await browser.close();
    return responses;

};