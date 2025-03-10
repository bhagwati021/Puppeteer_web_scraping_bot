import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ThumbsUp, Clock } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category: string;
  createdAt: string;
  summary?: string;
}

const HomePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'programming', name: 'Programming' },
    { id: 'technology', name: 'Technology' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' },
    { id: 'education', name: 'Education' },
  ];

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Create a timeout promise to handle API timeouts
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 5000);
        });

        // Create the actual API request
        const apiPromise = axios.get('http://localhost:5000/api/questions');

        // Race the API request against the timeout
        const response = await Promise.race([apiPromise, timeoutPromise]) as any;

        // Ensure we're only storing serializable data
        const serializedQuestions = response.data.map((q: any) => ({
          _id: q._id,
          text: q.text,
          category: q.category,
          createdAt: q.createdAt,
          summary: q.summary || null
        }));
        setQuestions(serializedQuestions);
        setLoading(false);
      } catch (error) {
        // If the server is not running, load mock data
        if (error instanceof Error && (error.message.includes('Network Error') || error.message.includes('timed out'))) {
          // Mock data for demonstration when server is not available
          const mockQuestions = [
            {
              _id: '1',
              text: 'How do I implement authentication in a MERN stack application?',
              category: 'programming',
              createdAt: new Date().toISOString(),
              summary: 'Use JWT tokens for authentication in MERN stack. Store tokens in HTTP-only cookies or localStorage, implement middleware for protected routes, and use bcrypt for password hashing.'
            },
            {
              _id: '2',
              text: 'What are the best practices for React state management in 2025?',
              category: 'programming',
              createdAt: new Date().toISOString(),
              summary: 'Modern React state management in 2025 favors React Query for server state, Zustand for global state, and Context API with useReducer for complex component state. Consider the trade-offs between simplicity and performance.'
            },
            {
              _id: '3',
              text: 'How does quantum computing affect cryptography?',
              category: 'technology',
              createdAt: new Date().toISOString(),
              summary: 'Quantum computing threatens current cryptographic methods by potentially breaking RSA and ECC through Shor\'s algorithm. Post-quantum cryptography is being developed to create quantum-resistant algorithms.'
            }
          ];
          setQuestions(mockQuestions);
          setError("Server connection failed. Showing demo data.");
        } else {
          setError("Failed to fetch questions. Please try again later.");
        }
        console.error('Error fetching questions:', error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchQuestions();
  }, []);

  const filteredQuestions = activeCategory === 'all'
    ? questions
    : questions.filter(q => q.category === activeCategory);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Recent Questions</h1>
        <Link
          to="/ask"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Ask a Question
        </Link>
      </div>

      <div className="mb-6 flex overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            className={`px-4 py-2 rounded-full mr-2 whitespace-nowrap ${
              activeCategory === category.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
          <p className="text-yellow-700">{error}</p>
          {error.includes("Server connection") && (
            <p className="mt-2 text-sm text-gray-600">
              To see real data, start the server with <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:server</code>
            </p>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 text-lg">No questions found in this category.</p>
          <p className="mt-2 text-gray-500">Be the first to ask a question!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <Link
              key={question._id}
              to={`/question/${question._id}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                    {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
                  </span>
                  <span className="ml-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(question.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{question.text}</h2>
                {question.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{question.summary}</p>
                )}
                <div className="flex items-center text-gray-500">
                  <div className="flex items-center mr-4">
                    <MessageCircle className="h-5 w-5 mr-1" />
                    <span>3 answers</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="h-5 w-5 mr-1" />
                    <span>5 likes</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;