import mongoose from "mongoose";

// Stores user-submitted questions
const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  category:{ type: String } ,
  image: { type: Buffer }, // Store the image as binary data
  // image: { type: String }, // Store the image URL or file path
  createdAt: { type: Date, default: Date.now },
  summary: { type: String, default: null }, // Stores the summarized response

  
});

export const Question = mongoose.model("Question", questionSchema);