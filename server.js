import express from "express";
import { QuoraScrapeAnswers, loginToSiteQuora,loginToSiteStack,StackOverflowScrapeAnswers } from "./scraper.js";
import { Question, Response } from "./models/models.js";
import connectDB from "./db.js"; // Import the database connection
import mongoose from "mongoose";


const app = express();
app.use(express.json());

// Connect to MongoDB before starting the server
connectDB();

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Welcome to the Social Media Doubt App!");
  });
  

// Submit a question
app.post("/ask", async (req, res) => {
  const { text, userId } = req.body;
  const question = await Question.create({ text, userId });

  // Trigger scraping asynchronously
 
 // QuoraScrapeAnswers(question);
  StackOverflowScrapeAnswers(question);
  QuoraScrapeAnswers(question);
  
  res.json({ message: "Processing your query!", question });
});

// Get responses
app.get("/responses/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ error: "Invalid question ID format" });
    }

    const objectId = new mongoose.Types.ObjectId(questionId);
    const responses = await Response.find({ questionId: objectId });

    if (!responses || responses.length === 0) {
      return res.status(404).json({ message: "No responses found" });
    }

    res.json(responses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});


  app.post("/login", async (req, res) => {
    const { site, email, Password } = req.body;
  
    try {
        let session;

        if (site === "https://www.quora.com/") {
            session = await loginToSiteQuora(site, email, Password);
        } else if (site === "https://stackoverflow.com/") {
            session = await loginToSiteStack(site,email, Password);
        } else {
            return res.status(400).json({ error: "Unsupported site. Use 'quora' or 'stackoverflow'." });
        }

        res.json(session);
    } catch (error) {
        res.status(500).json({ error: "Login failed", details: error.message });
    }
});
  

