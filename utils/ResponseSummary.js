import { Response } from "../models/ResponseModel";
import { Question } from "../models/QuestionModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from '../logs/logger.js'

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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
            contents: [{ role: "user", parts: [{ text: `
        Summarize the following responses to create a comprehensive answer:
        
        ${responseText}
        
        Provide a well-structured summary that:
        1. Addresses the main question directly
        2. Includes key points from all sources
        3. Resolves any contradictions between sources
        4. Is clear and concise (around 250 words)
        ` }] }]
        });

        // Extract summary text safely
        const summaryText = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text || "Summary not available";

        // Update the question with the generated summary
        await Question.findByIdAndUpdate(questionId, { summary: summaryText }, { new: true });

        logger.info(`Summary updated for question: ${questionId}`);
        return summaryText;
    } catch (error) {
        logger.error("Error summarizing responses:", error);
        return null;
    }
};

