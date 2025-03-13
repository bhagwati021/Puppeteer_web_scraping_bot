import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AskQuestionPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [image, setImage] = useState<File | null>(null); // For the uploaded image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUnavailable, setServerUnavailable] = useState(false);
  const [scrapingMessage, setScrapingMessage] = useState<string | null>(null); // Scraping status
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      setError("Question cannot be empty!");
      return;
    }
    
    setLoading(true);
    setError(null);
    setScrapingMessage(null);

    const formData = new FormData();
    formData.append('userId', '64a83bd239ab67c9e456d3f2'); // Replace with actual user ID logic
    formData.append('text', question);
    if (image) {
      formData.append('image', image); // Include the uploaded image
    }
    
    try {
      // Create a timeout promise to handle API timeouts
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out')), 5000);
      });
      
      // Create the actual API request
      
      const apiPromise = axios.post('http://backend.bhagwatibashyal.site:5000/api/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;

      if (!response.data || !response.data._id) {
        throw new Error('Invalid server response: Missing question ID');
      }  
      const questionId = response.data._id;

      // Trigger scraping for the question
      setScrapingMessage('Scraping answer...');
      const scrapingResponse = await axios.post(`http://backend.bhagwatibashyal.site:5000/api/scraping/scrape/${questionId}`);
      if (scrapingResponse.data?.summary) {
        setScrapingMessage('Scraping completed successfully!');
      } else {
        setScrapingMessage('Scraping completed but no summary was generated.');
      }

      navigate(`/question/${response.data._id}`);
    } catch (error: any) {
      if (error.message.includes('Network Error') || error.message.includes('timed out')) {
        setServerUnavailable(true);
      } else {
        setError(error.response?.data?.message || 'Failed to submit question. Please try again later.');
      }
      console.error('Error submitting question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };
  return (
    <div className="max-w-3xl mx-auto">
      {serverUnavailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
          <p className="text-yellow-700">
            <strong>Demo Mode:</strong> Server connection failed. Your question will be saved locally.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            To save questions to the database, start the server with <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:server</code>
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Ask a Question</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Your Question
            </label>
            <textarea
              id="question"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="What would you like to know?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            ></textarea>
            <p className="mt-1 text-sm text-gray-500">
              Be specific and clear to get better answers
            </p>
          </div>
          <div className="mb-6">
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
  Upload an Image (Optional)
</label>
<input
  id="image"
  type="file"
  accept="image/*"
  className="w-full p-2 border border-gray-300 rounded-md bg-blue-50 text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  onChange={handleImageChange}
/>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          >
            {loading ? 'Submitting...' : 'Submit Question'}
          </button>
        </form>
        
        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">How it works</h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2">
            <li>Submit your question with a relevant category</li>
            <li>Our AI will analyze and categorize your question</li>
            <li>We'll scrape relevant websites for the best answers</li>
            <li>The AI will summarize the findings into a comprehensive answer</li>
            <li>You can view all original sources and add your own comments</li>
          </ol>
        </div>
        {scrapingMessage && (
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Scraping Status</h2>
            <p className="text-gray-700">{scrapingMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AskQuestionPage;