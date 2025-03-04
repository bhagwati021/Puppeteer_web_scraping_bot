import mongoose from "mongoose";

// Stores scraped responses
const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  source: { type: String, required: true },
  content: { type: String, required: true },
  url: { type: String, required: true },
  scrapedAt: { type: Date, default: Date.now },
});

export const Response = mongoose.model("Response", responseSchema);