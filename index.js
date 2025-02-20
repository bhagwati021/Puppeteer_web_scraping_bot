import puppeteer from 'puppeteer';



(async ()=>{

// Launch the browser and open a new blank page
const browser = await puppeteer.launch({ headless: true }); //headless: true:does not open up the browser
const page = await browser.newPage();


    // Set User-Agent and viewport
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

// Navigate the page to a URL.
await page.goto('https://stackoverflow.com/questions',{ waitUntil: "networkidle2" });
// await page.waitForNavigation();




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