import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Stores user-submitted questions
const questionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  category:{ type: String } ,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  summary: { type: String, default: null }, // Stores the summarized response
});

// Stores scraped responses
const responseSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  source: { type: String, required: true },
  content: { type: String, required: true },
  url: { type: String, required: true },
  scrapedAt: { type: Date, default: Date.now },
});

// Comment Schema (for user comments)
const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Credential Schema (for storing site login credentials)
const credentialSchema = new mongoose.Schema({
  site: { type: String, required: true, index: true }, 
  email: String,
  Password: String,  // Should be hashed
  cookies: Array,
  csrfToken: String,
});

// Stores metadata like lastUsedIndex
const metadataSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true }, 
  value: { type: Number, default: -1 }
});

export const Metadata = mongoose.model("Metadata", metadataSchema);
export const Question = mongoose.model("Question", questionSchema);
export const Response = mongoose.model("Response", responseSchema);
export const Credential = mongoose.model("Credential", credentialSchema);
export const User = mongoose.model('User', userSchema);
export const Comment = mongoose.model('Comment', commentSchema);
