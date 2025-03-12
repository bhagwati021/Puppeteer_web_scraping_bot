import express from 'express';
import { Question } from '../models/QuestionModel.js'
import { Response } from '../models/ResponseModel.js';
import { summarizeResponses } from '../utils/ResponseSummary.js';
import multer from "multer";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG and PNG formats are allowed."));
    }
    cb(null, true);
  },
});
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
router.post('/', upload.single("image"), async (req, res) => {
  const { userId, text } = req.body;
  const imagePath = req.file ? req.file.path : null; // Get the file path

  if (!userId || !text) {
    return res.status(400).json({ message: "userId and text are required." });
  }
  
  try {
    const newQuestion = new Question({
      userId,
      text,
      image: imagePath, // Save the file path
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


// Delete a question and its related responses
router.delete('/:id', async (req, res) => {
  try {
    const questionId = req.params.id;

    // Find and delete the question
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    await Question.findByIdAndDelete(questionId);

    // Delete all responses related to the question
    await Response.deleteMany({ questionId });

    res.status(200).json({ message: 'Question and related responses deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;