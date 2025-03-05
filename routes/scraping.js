import express from 'express';
import { Question } from '../models/QuestionModel.js';
import { QuoraScrapeAnswers } from '../utils/QuoraScraper.js'
import{ StackOverflowScrapeAnswers } from '../utils/StackScraper.js';
import { summarizeResponses } from '../utils/ResponseSummary.js';
import { categorizeQuestion } from '../utils/nlp.js';

const router = express.Router();

// Trigger scraping for a question
router.post('/scrape/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Determine category if not already set
    if (!question.category) {
      const category = await categorizeQuestion(question.text);
      question.category = category;
      await question.save();
    }
    
    // Start scraping based on category
    let responses = [];
    
    // Scrape from different sources based on category
    if (question.category === 'programming' || question.category === 'technology') {
      // Scrape from Stack Overflow
      const stackResponses = await StackOverflowScrapeAnswers(question);
      if (stackResponses) responses = responses.concat(stackResponses);
      
      // Scrape from Quora
      const quoraResponses = await QuoraScrapeAnswers(question);
      if (quoraResponses) responses = responses.concat(quoraResponses);
    } else {
      // For other categories, just scrape from Quora
      const quoraResponses = await QuoraScrapeAnswers(question);
      if (quoraResponses) responses = responses.concat(quoraResponses);
    }
    
    // Generate summary from all responses
    const summary = await summarizeResponses(questionId);
    
    res.status(200).json({ 
      message: 'Scraping completed successfully',
      responseCount: responses.length,
      summary
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;