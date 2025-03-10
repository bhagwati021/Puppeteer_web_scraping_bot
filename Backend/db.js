import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "./logs/logger.js";

dotenv.config(); // Load environment variables

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("✅ MongoDB Connected Successfully");
  } catch (error) {
    logger.info("❌ MongoDB Connection Error:", error);
    process.exit(1); // Exit process with failure
  }
};


export default connectDB;
