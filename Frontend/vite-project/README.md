# DoubtSolver - Social Media Doubt App

A full-stack MERN application that scrapes websites based on categories to answer user questions.

## Features

- Ask questions and get AI-generated answers from multiple sources
- Web scraping from sites like Stack Overflow and Quora
- AI-powered question categorization and answer summarization
- User authentication and profiles
- Comment system for community interaction

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Web Scraping**: Puppeteer, Cheerio
- **AI Integration**: Google Gemini API

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/doubt-resolver
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Running the Application

To run both frontend and backend concurrently:
```
npm run dev:full
```

To run only the frontend:
```
npm run dev
```

To run only the backend:
```
npm run dev:server
```

## Project Structure

- `/src` - Frontend React application
- `/server` - Backend Express server
  - `/models` - MongoDB schemas
  - `/routes` - API routes
  - `/utils` - Utility functions for scraping and NLP

## API Endpoints

- **Questions**
  - `GET /api/questions` - Get all questions
  - `GET /api/questions/:id` - Get a specific question with responses
  - `POST /api/questions` - Create a new question
  - `GET /api/questions/:id/summary` - Get AI summary for a question

- **Users**
  - `POST /api/users/register` - Register a new user
  - `POST /api/users/login` - Login user

- **Comments**
  - `GET /api/comments/question/:questionId` - Get all comments for a question
  - `POST /api/comments` - Create a new comment

- **Scraping**
  - `POST /api/scraping/scrape/:questionId` - Trigger scraping for a question

## License
