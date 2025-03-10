import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logs/logger.js";

// Initialize Gemini API

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Function to categorize a question using Gemini
export const categorizeQuestion = async (questionText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Categorize the following question into one of these categories:
    - programming
    - technology
    - science
    - health
    - education
    - general
    
    Return ONLY the category name, nothing else.
    
    Question: ${questionText}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const category = response.text().trim().toLowerCase();
    
    logger.info(`ℹ️ catagory type ${category}`)
    // Validate the category
    const validCategories = ['programming', 'technology', 'science', 'health', 'education', 'general'];
    if (!validCategories.includes(category)) {
      return 'general'; // Default to general if invalid category
    }
    
    return category;
  } catch (error) {
    logger.error("❌ Error categorizing question:", error);
    return 'general'; // Default category on error
  }
};

// Function to summarize a question
export const summarizeQuestion = async (questionText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Summarize this question in a concise way that preserves the main intent:
    
    ${questionText}
    
    Keep the summary under 100 characters if possible.
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    logger.info(`ℹ️ Successfully summarized question as:${ response.text().trim()}`)
    return response.text().trim();
  } catch (error) {
    logger.error("❌ Error summarizing question:", error);
    return questionText; // Return original text on error
  }
};



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
