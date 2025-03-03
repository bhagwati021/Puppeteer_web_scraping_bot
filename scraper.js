// import puppeteer from "puppeteer";
import puppeteer from 'puppeteer-extra';
import { Credential, Response, Metadata,Question } from "./models/models.js";
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from "@google/generative-ai";
import winston from 'winston';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const API_KEY = "AIzaSyBPSX1lR0Z-GxqsTzJRqjzuhDmH1jY3CHQ" // Store securely (e.g., in .env)
const genAI = new GoogleGenerativeAI(API_KEY);
import { pipeline } from "@xenova/transformers";
// Proxy setup


// Apply Stealth Plugin
puppeteer.use(StealthPlugin());

// Logger configuration
const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename:'logs/app.log' })
    ]
});


// Function to get the next available temp email in round-robin fashion
const getNextTempEmail = async (site) => {

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

        logger.info("summary created..");
        return summary || "No summary available.";

    } catch (error) {
        logger.error(`Error summarizing with Gemini: ${error.message}`);
        console.error("Error summarizing with Gemini:", error.message);
        return "Error summarizing content.";
    }
};


// Authentication & Cookie Handling
export const loginToSiteQuora = async (site, email, Password) => {
    logger.info("Starting Puppeteer browser for quora...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try{
    logger.info("Navigating to quora..");
    await page.goto(site, { waitUntil: "networkidle2" });
    await page.type("input[type='email']", email);
    await page.type("input[type='password']", Password);
    await page.click("div.q-flex.qu-justifyContent--space-between.qu-alignItems--center > button");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    logger.info("Closing browser...");
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
        logger.info(`Successfully added credentials for ${email} on ${site}`);
    } else{
        logger.warn(`Credentials for ${email} on ${site} already exist.`);
    }
    await browser.close();
    return { cookies };

    } catch(error){
        logger.error(`Error occurred: ${error.message}`);
        await browser.close();
        throw error;
    }
};


export const loginToSiteStack = async (site, email, Password) => {
    logger.info("Starting Puppeteer browser for StackOverflow...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
    // Set User-Agent and viewport
    logger.info("Navigating to Stack Overflow...");
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(site, { waitUntil: "networkidle2" });
    await page.click("body > header > div > nav > ol > li:nth-child(3) > a");             //navigate to login button
    // await page.click('a[href^="https://stackoverflow.com/users/login"]');

    await page.waitForSelector("#email");
    await page.type("#email", email);
    await page.waitForSelector("#password");
    await page.type("#password", Password);
    await page.click("#submit-button");

    await page.waitForNavigation({ waitUntil: "networkidle2" });

    const cookies = await page.cookies();
    

    // Check if the email already exists for the same site
    const existingCredential = await Credential.findOne({ site, email });
    if (!existingCredential) {
        await Credential.create({
            site,
            email,
            Password, // Ensure hashing
            cookies,
        });
        logger.info(`Successfully added credentials for ${email} on ${site}`);
    } else{
        logger.warn(`Credentials for ${email} on ${site} already exist.`);
    }

    await browser.close();
    return { cookies };

    }catch(error){
        logger.error(`Error occurred: ${error.message}`);
        await browser.close();
        throw error;
    }   
};


//Scraping the answer from Quora
export const QuoraScrapeAnswers = async (query) => {
    
   /*  // Step 0: Summarize user query before searching
    const summarizedQuery = await summarizeWithCompromise(query.text);
    logger.info(`🔍 Summarized Query: ${summarizedQuery}`);
 */
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

    console.log(questionLinks);
/* 
    // Get the 6th URL which is the which is the first result
    const questionUrl = questionLinks[6];  
    logger.info(`🔍 successfully extracted the first links for the relavent answer(Quora)}`);                                          

 */

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


   /*  // Step 5: Scrape the first answer
    const firstAnswer = await page.evaluate(() => {
        const answerContainer = document.querySelector(
            "#mainContent > div:nth-child(3) > div.q-box.dom_annotate_question_answer_item_0.qu-borderAll.qu-borderColor--raised.qu-boxShadow--small.qu-mb--small.qu-bg--raised > div > div > div > div > div:nth-child(1) > div.q-box > div.q-click-wrapper.c1nud10e.qu-display--block.qu-tapHighlight--none.qu-cursor--pointer > div.q-box.spacing_log_answer_content.puppeteer_test_answer_content > div > div > div"
            
        );
    
        return answerContainer ? answerContainer.innerText.trim() : null;  // Handle case where element is missing
    }); */
     
    
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

    //console.log("📄 First answer extracted(Quora):", firstAnswer);
    logger.info(`📄 First answer extracted(Quora):${firstAnswer}`);

   /*  // Step 7: Summarize the answer using Gemini
    logger.info(`✍️ Summarizing answer with Gemini(Quora)...`);
    console.log("✍️ Summarizing answer with Gemini(Quora)...");
    const summary = await summarizeWithGemini(firstAnswer);
    console.log("✅ Summary(Quora):", summary);
    logger.info(`✅ Summary Generated!!(Quora):`); */
    

    // Step 8: Store the summarized answer in MongoDB
    const responseEntry = new Response({
        questionId: query._id,
        source: "Quora",
        content: firstAnswer,
        url: questionUrl,
    });

    await responseEntry.save();

    responses.push(responseEntry);
    logger.info(`💾 Summarized answer saved to database`);
}

    await browser.close();
    return responses;

};

// Function to scrape answers from Stack Overflow
export const StackOverflowScrapeAnswers = async (query) => {

    const site = "https://stackoverflow.com/";
    const account = await getNextTempEmail(site);
    if (!account) throw new Error("No valid user account found!");

    console.log(`🔄 Using account: ${account.email} for scraping`);

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
    
 /*     
    // Load stored cookies for authentication
    const credentials = await Credential.findOne({ site: "https://stackoverflow.com/" });

    if (!credentials || !credentials.cookies || credentials.cookies.length === 0) {
        console.log("⚠️ No valid cookies found! You might need to log in manually first.");
        await browser.close();
        return null;
    }

    if (!credentials) throw new Error("No credentials found!");
    console.log("🍪 Applying stored cookies...");
    await page.setCookie(...credentials.cookies);

*/

   
    // Step 1: Search for the question
    console.log(`🔍 Searching Stack Overflow for: ${query.text}`);
    await page.goto(`https://stackoverflow.com/`, { waitUntil: "networkidle2" });

    // Apply stored cookies from the retrieved account
    if (account.cookies && account.cookies.length > 0) {
        console.log("🍪 Applying stored cookies for authentication...");
        await page.setCookie(...account.cookies);
    } else {
        console.log("⚠️ No valid cookies found! You might need to log in manually first.");
        await browser.close();
        return null;
    }

    // Handle CSRF Token
    const getCSRFToken = async (page) => {
        const csrfToken = await page.evaluate(() => {
            return document.querySelector('input[name="fkey"]')?.value;
        });
        return csrfToken;
    };

    const csrfToken = await getCSRFToken(page);
    console.log("🔑 CSRF Token:", csrfToken);

    // Step 2: Type the search query
    const searchSelector = 'input[name="q"]';
    await page.waitForSelector(searchSelector); // Ensure search box is loaded
    await page.type(searchSelector, query.text); // Type query
    await page.keyboard.press('Enter'); // Press Enter to search

    
    // Step 3: Wait for you to manually solve CAPTCHA
    console.log("⚠️ Please solve the CAPTCHA manually. Waiting for 30 seconds...");
    await new Promise(resolve => setTimeout(resolve, 50000));
    console.log("✅ Continuing after CAPTCHA...");

/* 
    // Step 2: Get the first search result link
    const questionLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("s-post-summary--content h3 a")).map(el => el.href);
        return links;
    });
*/

    // Step 2: Get the first search result link
    const questionLinks = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll(".s-post-summary--content h3 a")).map(el => el.href);
        return links;
    });
    console.log(questionLinks);

    
    const selectedLinks = [];
    const positions = [0,1,2,3,4]; 
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
    logger.info(`🔗 Visiting question page: ${questionUrl}`);
    await page.goto(questionUrl, { waitUntil: "networkidle2" });

    // Step 3: Extract page content
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);

    // Step 4: Scrape the first answer
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

    logger.info(`📄 First answer extracted(stack):${firstAnswer}`);
    //console.log("📄 First answer extracted:", firstAnswer);

   /*  // Step 5: Summarize the answer
    console.log("✍️ Summarizing answer with Gemini...");
    const summary = await summarizeWithGemini(firstAnswer);
    console.log("✅ Summary:", summary);
 */
    // Step 6: Store in MongoDB
    const responseEntry = new Response({
        questionId: query._id,
        source: "Stack Overflow",
        content: firstAnswer,
        url: questionUrl,
    });

    await responseEntry.save();
    console.log("💾 Summarized answer saved to database!");
    }
    await browser.close();
    return responses;


};


export const fetchResponse = async (questionId) => {
    const Response = mongoose.model("Response", responseSchema);
    try {
        const responses = await Response.find({ question_id: questionId }).select("-_id response_text");
        console.log("Responses:", responses);
    } catch (error) {
        console.error("Error fetching responses:", error);
    } finally {
        mongoose.connection.close();
    }

}


// **Function to summarize the user query using Compromise**
/* //const summarizeWithCompromise = async (text) => {
     const summarizer = await pipeline('summarization');
     let summary = await summarizer(text);
     return summary;
 */
 
    /*   // Load summarization pipeline
      const summarizer = await pipeline("summarization", "Xenova/bart-large-cnn");
     
      // Generate summary
      const summary = await summarizer(text, { max_length: 20, min_length: 5 });
      return summary[0].summary_text; */
     /* const doc = nlp(text);
 
     // Extract meaningful parts of the question
     const mainSentence = doc.sentences().toPastTense().out("text"); // Keep structure
     const keyNouns = doc.nouns().toSingular().out("array").slice(0, 3); // Limit to 3 main topics
     const keyVerbs = doc.verbs().toInfinitive().out("array").slice(0, 2); // Limit to 2 main actions
 
     // Form a concise summary
     const summary = `${keyNouns.join(" ")} ${keyVerbs.join(" ")}?`;
 
     return summary.length > 10 ? summary : mainSentence; // Fallback to full sentence if too short 
 };
 */

export const summarizeResponses = async (questionId) => {
    try {
        const responses = await Response.find({ questionId });
        if (!responses.length) return null;

        // Combine all responses into one text block
        const responseText = responses.map(r => r.content).join('\n');

        // Initialize Gemini Model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Generate summary using Gemini API
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: `Summarize the following responses:\n\n${responseText}` }] }]
        });

        // Extract summary text safely
        const summaryText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary not available";

        // Update the question with the generated summary
        await Question.findByIdAndUpdate(questionId, { summary: summaryText }, { new: true });

        console.log(`Summary updated for question: ${questionId}`);
        return summaryText;
    } catch (error) {
        console.error("Error summarizing responses:", error);
        return null;
    }
};


