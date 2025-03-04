import mongoose from "mongoose";

// Credential Schema (for storing site login credentials)
const credentialSchema = new mongoose.Schema({
  site: { type: String, required: true, index: true }, 
  email: String,
  Password: String,  // Should be hashed
  cookies: Array,
  csrfToken: String,
});

export const Credential = mongoose.model("Credential", credentialSchema);