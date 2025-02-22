import puppeteer from "puppeteer";
import { Credential, Response } from "./models/models.js";
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBPSX1lR0Z-GxqsTzJRqjzuhDmH1jY3CHQ" // Store securely (e.g., in .env)
const genAI = new GoogleGenerativeAI(API_KEY);

// Function to get a summarized response using Gemini AI
const summarizeWithGemini = async (text) => {
    try {
        if (!text) return "No text provided for summarization.";

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate summary with a concise request
        const prompt = `Summarize this in 1-2 sentences:\n\n${text}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return summary || "No summary available.";
    } catch (error) {
        console.error("Error summarizing with Gemini:", error.message);
        return "Error summarizing content.";
    }
};

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

    return { cookies };
};

export const QuoraScrapeAnswers = async (query) => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // Load stored cookies for authentication
    const credentials = await Credential.findOne({ site: "https://www.quora.com/" });
    if (!credentials) throw new Error("No credentials found!");
    await page.setCookie(...credentials.cookies);

    // Step 1: Search for the question
    console.log(`🔍 Searching for: ${query.text}`);
    await page.goto("https://www.quora.com/", { waitUntil: "networkidle2" });

    await page.type("input[placeholder='Search Quora']", query.text);

    // Step 2: Click the first search result
    const firstResultSelector = "div[role='option']";
    await page.waitForSelector(firstResultSelector, { visible: true });
    await page.click(firstResultSelector);
    await page.waitForNavigation({ waitUntil: "networkidle2" });


    // Step 2: Get the first search result link
    const questionLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("a.q-box")).map(el => el.href);
        return links;
    });

    const questionUrl = questionLinks[6]; // Get the 6th URL

    console.log(`🔗 Visiting question page: ${questionUrl}`);
    await page.goto(questionUrl, { waitUntil: "networkidle2" });

     // Step 3: Get the page content
     const pageContent = await page.content();

     // Step 4: Use Cheerio to parse the HTML and extract the answer
    const $ = cheerio.load(pageContent);

    //////////////////////////////////////////////////////////////////////////////////////////////////////////


    let firstAnswer = $(".q-box.spacing_log_answer_content.puppeteer_test_answer_content > div > div > div")
        .first()
        .text()
        .trim();

   /*  // Step 3: Scrape the first answer
    const firstAnswer = await page.evaluate(() => {
        const answerContainer = document.querySelector(
            "#mainContent > div:nth-child(3) > div.q-box.dom_annotate_question_answer_item_0.qu-borderAll.qu-borderColor--raised.qu-boxShadow--small.qu-mb--small.qu-bg--raised > div > div > div > div > div:nth-child(1) > div.q-box > div.q-click-wrapper.c1nud10e.qu-display--block.qu-tapHighlight--none.qu-cursor--pointer > div.q-box.spacing_log_answer_content.puppeteer_test_answer_content > div > div > div"
            
        );
    
        return answerContainer ? answerContainer.innerText.trim() : null;  // Handle case where element is missing
    }); */

    if (!firstAnswer) {
        console.log("❌ No answer found! Retrying with alternative selector...");
        
        // Try a different selector if first attempt fails
        const fallbackAnswer = await page.evaluate(() => {
            const altAnswerContainer = document.querySelector(".q-text > span > span");
            return altAnswerContainer ? altAnswerContainer.innerText.trim() : null;
        });
    
        if (!fallbackAnswer) {
            console.log("🚨 No answer found even with fallback selector. Exiting.");
            await browser.close();
            return null;
        }
    
        console.log("✅ Found answer using fallback selector:", fallbackAnswer);
        return fallbackAnswer;
    }

    console.log("📄 First answer extracted:", firstAnswer);

//////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Step 4: Summarize the answer using Gemini
    console.log("✍️ Summarizing answer with Gemini...");
    const summary = await summarizeWithGemini(firstAnswer);
    console.log("✅ Summary:", summary);

    // Step 5: Store the summarized answer in MongoDB
    const responseEntry = new Response({
        questionId: query._id,
        source: "Quora",
        content: summary,
        url: questionUrl,
    });

    await responseEntry.save();
    console.log("💾 Summarized answer saved to database!");

    await browser.close();
    return responseEntry;

};
