import mongoose from "mongoose";

// Stores metadata like lastUsedIndex
const metadataSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true }, 
  value: { type: Number, default: -1 }
});

export const Metadata = mongoose.model("Metadata", metadataSchema);