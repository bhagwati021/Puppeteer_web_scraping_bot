import express from "express";
import connectDB from "./db.js"; // Import the database connection
import { logger } from "./logs/logger.js";
import dotenv from 'dotenv';
import cors from 'cors';


import scrapingRoutes from './routes/scraping.js';
import questionRoutes from './routes/questions.js';
import userRoutes from './routes/users.js';
import commentRoutes from './routes/comments.js';

// Configuration
dotenv.config();


const app = express();
app.use(express.json());

// Middleware
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/scraping', scrapingRoutes);

// Connect to MongoDB before starting the server
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.get("/", (req, res) => {
    res.send("Welcome to the Social Media Doubt App!");
  });
  

const PORT = process.env.PORT
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
});
