import mongoose from "mongoose";

// Stores user-submitted questions
const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  category:{ type: String } ,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  summary: { type: String, default: null }, // Stores the summarized response
});

export const Question = mongoose.model("Question", questionSchema);