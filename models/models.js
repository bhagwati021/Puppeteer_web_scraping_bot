import mongoose from "mongoose";

// Stores user-submitted questions
const questionSchema = new mongoose.Schema({
  text: String,
  userId: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
});

export const Question = mongoose.model("Question", questionSchema);

// Stores scraped responses
const responseSchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  source: String,
  content: String,
  url: String,
  scrapedAt: { type: Date, default: Date.now },
});

export const Response = mongoose.model("Response", responseSchema);

// Stores login credentials securely
const credentialSchema = new mongoose.Schema({
  site: String,
  email: String,
  Password: String,  // Should be hashed
  cookies: Array,
  csrfToken: String,
});

export const Credential = mongoose.model("Credential", credentialSchema);


// Stores metadata like lastUsedIndex
const metadataSchema = new mongoose.Schema({
  key: { type: String, unique: true }, 
  value: Number
});

export const Metadata = mongoose.model("Metadata", metadataSchema);