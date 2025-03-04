import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY ;
const genAI = new GoogleGenerativeAI(API_KEY);

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
    
    // Validate the category
    const validCategories = ['programming', 'technology', 'science', 'health', 'education', 'general'];
    if (!validCategories.includes(category)) {
      return 'general'; // Default to general if invalid category
    }
    
    return category;
  } catch (error) {
    console.error("Error categorizing question:", error);
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
    return response.text().trim();
  } catch (error) {
    console.error("Error summarizing question:", error);
    return questionText; // Return original text on error
  }
};