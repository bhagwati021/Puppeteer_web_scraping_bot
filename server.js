import express from "express";
import { QuorascrapeAnswers, loginToSite } from "./scraper.js";
import { Question, Response } from "./models/models.js";
import connectDB from "./db.js"; // Import the database connection


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
  QuorascrapeAnswers(question);

  res.json({ message: "Processing your query!", question });
});

// Get responses
app.get("/responses/:questionId", async (req, res) => {
  const responses = await Response.find({ questionId: req.params.questionId });
  res.json(responses);
});

app.post("/login", async (req, res) => {
    const { site, email, Password } = req.body;
  
    // Validate if site is Quora
    if (site !== "https://www.quora.com/") {
      return res.status(400).json({ error: "Only Quora login is supported." });
    }
  
    try {
      const session = await loginToSite(site, email, Password);
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Login failed", details: error.message });
    }
  });
  

