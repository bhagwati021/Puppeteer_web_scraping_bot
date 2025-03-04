import express from 'express';
import { Question, Response } from '../models/models.js';
import { summarizeResponses } from '../utils/scraper.js';

const router = express.Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Get a specific question with its responses
router.get('/:id', async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    const responses = await Response.find({ questionId: req.params.id });
    
    res.status(200).json({ question, responses });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Create a new question
router.post('/', async (req, res) => {
  const { userId, text, category } = req.body;
  
  try {
    const newQuestion = new Question({
      userId,
      text,
      category,
      createdAt: new Date().toISOString()
    });
    
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

// Get AI summary for a question
router.get('/:id/summary', async (req, res) => {
  try {
    const questionId = req.params.id;
    const summary = await summarizeResponses(questionId);
    
    if (!summary) {
      return res.status(404).json({ message: 'No responses found to summarize' });
    }
    
    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;