import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Comment = mongoose.model('Comment', commentSchema);