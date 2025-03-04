import express from 'express';
import { Comment } from '../models/models.js';

const router = express.Router();

// Get all comments for a question
router.get('/question/:questionId', async (req, res) => {
  try {
    const comments = await Comment.find({ questionId: req.params.questionId })
      .sort({ createdAt: -1 });
    res.status(200).json(comments);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Create a new comment
router.post('/', async (req, res) => {
  const { userId, questionId, text } = req.body;
  
  try {
    const newComment = new Comment({
      userId,
      questionId,
      text,
      createdAt: new Date().toISOString()
    });
    
    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
});

export default router;