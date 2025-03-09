import fetch from 'node-fetch';
import { logger } from '../logs/logger.js';
import { Response } from '../models/ResponseModel.js';

/**
 * Fetches the most relevant Stack Overflow question IDs for a given query.
 * @param {string} query - The search query (e.g., "django rest api error").
 * @returns {Array} The array of question IDs and titles. */
async function searchQuestions(query) {
    const url = `https://api.stackexchange.com/2.3/search?order=desc&sort=relevance&intitle=${encodeURIComponent(query)}&site=stackoverflow`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
            const questions = data.items.slice(0, 5); // Most relevant 5 questions
            logger.info(`🔍 Found ${questions.length} matching questions.`);
            questions.forEach(question => {
                logger.info(`🔍 Found question: ${question.title} (ID: ${question.question_id}), URL: ${question.link}`);
            });
            return questions.map(question => ({
                question_id: question.question_id,
                title: question.title,
                link: question.link
            }));
        } else {
            logger.warn("⚠️ No matching questions found via API.");
            return [];
        }
    } catch (error) {
        logger.error("❌ Error fetching questions from API:", error);
        return [];
    }
}

/**
 * Fetches the top-voted answers for given Stack Overflow question IDs.
 * @param {Array} questions - The Stack Overflow question IDs and titles.
 * @returns {Array} The array of answers for all questions.
 */
async function getAnswers(questions) {
    const questionsWithAnswers = [];

    for (const question of questions) {
        const url = `https://api.stackexchange.com/2.3/questions/${question.question_id}/answers?order=desc&site=stackoverflow&filter=!9_bDE(fI5`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                const topAnswer = {
                    answer_id: data.items[0].answer_id,
                    body: data.items[0].body
                };

                logger.info(`✅ Found top answer for question ID ${question.question_id}.`);
                questionsWithAnswers.push({
                    question_id: question.question_id,
                    title: question.title,
                    link: question.link,
                    topAnswer: JSON.stringify(topAnswer)
                });
            } else {
                logger.warn(`⚠️ No answers found for question ID ${question.question_id}.`);
            }
        } catch (error) {
            logger.error(`❌ Error fetching answers for question ID ${question.question_id} from API:`, error);
        }
    }

return questionsWithAnswers;
}
    

/**
 * Main function to get Stack Overflow answers using the API.
 * @param {Object} query - The query object with text and _id.
 * @returns {Array|null} - The extracted answers.
 */
export const StackOverflowScrapeAnswers = async (query) => {
    try {
        logger.info(`🔍 Searching for: ${query.text}`);

        // Step 1: Try retrieving answers via Stack Exchange API
        const questions = await searchQuestions(query.text);
        if (questions.length > 0) {
            const questionsWithAnswers = await getAnswers(questions);
            if (questionsWithAnswers.length > 0) {
                logger.info(`✅ Successfully retrieved answers for ${questions.length} questions via API.`);
                
                // Save to MongoDB
                for (const question of questionsWithAnswers) {
                    const responseEntry = new Response({
                        questionId: query._id,
                        source: "Stack Overflow",
                        content: question.topAnswer, // Store the top answer
                        url: question.link,
                    });
                    await responseEntry.save();
                }
                return questionsWithAnswers;
            }
        }

        logger.warn("⚠️ No answers found for the given query.");
        return null;
    } catch (error) {
        logger.error("❌ Error in StackOverflowScrapeAnswers:", error);
        return null;
    }
};