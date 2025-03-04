import { Credential } from "../models/CredentialModel";
import { logger } from '../logs/logger.js'



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