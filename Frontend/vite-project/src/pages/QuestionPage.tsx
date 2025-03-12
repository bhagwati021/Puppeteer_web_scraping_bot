import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ExternalLink, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category: string;
  createdAt: string;
  summary?: string;
}

interface Response {
  _id: string;
  questionId: string;
  source: string;
  content: string;
  url: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  questionId: string;
  text: string;
  createdAt: string;
}

// Dummy data for offline mode
const dummyData: Record<string, {
  question: Question;
  responses: Response[];
  comments: Comment[];
}> = {
  '1': {
    question: {
      _id: '1',
      text: 'How do I implement authentication in a MERN stack application?',
      category: 'programming',
      createdAt: new Date().toISOString(),
      summary: 'Use JWT tokens for authentication in MERN stack. Store tokens in HTTP-only cookies or localStorage, implement middleware for protected routes, and use bcrypt for password hashing.'
    },
    responses: [
      {
        _id: 'r1',
        questionId: '1',
        source: 'Stack Overflow',
        content: 'For MERN authentication, use JWT tokens stored in HTTP-only cookies. Implement middleware to verify tokens on protected routes. Use bcrypt to hash passwords before storing them in MongoDB. Consider refresh tokens for better security.',
        url: 'https://stackoverflow.com/questions/12345678',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'r2',
        questionId: '1',
        source: 'Quora',
        content: 'I recommend using Passport.js with JWT strategy for MERN authentication. It provides a clean abstraction and supports multiple authentication methods.',
        url: 'https://quora.com/How-do-I-implement-authentication',
        createdAt: new Date().toISOString()
      }
    ],
    comments: [
      {
        _id: 'c1',
        userId: 'user1',
        questionId: '1',
        text: 'JWT with HTTP-only cookies is definitely the way to go!',
        createdAt: new Date().toISOString()
      }
    ]
  },
  '2': {
    question: {
      _id: '2',
      text: 'What are the best practices for React state management in 2025?',
      category: 'technology',
      createdAt: new Date().toISOString(),
      summary: 'Modern React state management favors React Query for server state, Zustand for global state, and Context API with useReducer for complex component state.'
    },
    responses: [
      {
        _id: 'r3',
        questionId: '2',
        source: 'Stack Overflow',
        content: 'In 2025, React Query handles server state beautifully. For global state, Zustand offers simplicity without Redux boilerplate. Context API with useReducer works well for complex component state.',
        url: 'https://stackoverflow.com/questions/87654321',
        createdAt: new Date().toISOString()
      }
    ],
    comments: [
      {
        _id: 'c2',
        userId: 'user2',
        questionId: '2',
        text: 'Zustand has been a game-changer for my projects',
        createdAt: new Date().toISOString()
      }
    ]
  },
  '3': {
    question: {
      _id: '3',
      text: 'How does quantum computing affect cryptography?',
      category: 'science',
      createdAt: new Date().toISOString(),
      summary: 'Quantum computing poses challenges to current cryptographic methods through Shor\'s algorithm. Post-quantum cryptography is being developed to address these concerns.'
    },
    responses: [
      {
        _id: 'r4',
        questionId: '3',
        source: 'Quora',
        content: 'Quantum computing poses a significant threat to current cryptographic methods. Shor\'s algorithm could break RSA and ECC encryption when implemented on quantum computers.',
        url: 'https://quora.com/quantum-cryptography',
        createdAt: new Date().toISOString()
      }
    ],
    comments: []
  }
};

const QuestionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [scraping, setScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestionData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Check if we have dummy data for this ID
        if (dummyData[id]) {
          const data = dummyData[id];
          setQuestion(data.question);
          setResponses(data.responses);
          setComments(data.comments);
          setIsOfflineMode(true);
          setError('Server connection failed. Showing demo data.');
        } else {
          const [questionRes, commentsRes] = await Promise.all([
            axios.get(`http://localhost:5000/api/questions/${id}`),
            axios.get(`http://localhost:5000/api/comments/question/${id}`)
          ]);

          setQuestion(questionRes.data.question);
          setResponses(questionRes.data.responses || []);
          setComments(commentsRes.data);
          setIsOfflineMode(false);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching question data:', error);
        // Try to load dummy data if available
        if (dummyData[id]) {
          const data = dummyData[id];
          setQuestion(data.question);
          setResponses(data.responses);
          setComments(data.comments);
          setIsOfflineMode(true);
          setError('Server connection failed. Showing demo data.');
        } else {
          setError('Failed to load question data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionData();
  }, [id]);

  const handleScrape = async () => {
    if (!id) return;
    
    if (isOfflineMode) {
      alert('Scraping is not available in demo mode');
      return;
    }
    
    setScraping(true);
    try {
      await axios.post(`http://localhost:5000/api/scraping/scrape/${id}`);
      const questionRes = await axios.get(`http://localhost:5000/api/questions/${id}`);
      setQuestion(questionRes.data.question);
      setResponses(questionRes.data.responses || []);
    } catch (error) {
      console.error('Error scraping data:', error);
      setError('Failed to scrape data. Please try again later.');
    } finally {
      setScraping(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    if (isOfflineMode) {
      const newCommentData: Comment = {
        _id: `c${Date.now()}`,
        userId: 'demo-user',
        questionId: id,
        text: newComment,
        createdAt: new Date().toISOString()
      };
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/comments', {
        userId: 'user123',
        questionId: id,
        text: newComment
      });

      const commentsRes = await axios.get(`http://localhost:5000/api/comments/question/${id}`);
      setComments(commentsRes.data);
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  {error && (
    <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
      {error}
    </div>
  )}

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 mb-4">Question not found</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {isOfflineMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
          <p className="text-yellow-700">
            <strong>Demo Mode:</strong> Server connection failed. Showing demo data.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            To see real data, start the server with <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:server</code>
          </p>
        </div>
      )}

      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Questions
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
              {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
            </span>
            <span className="ml-2 flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {formatDate(question.createdAt)}
            </span>
          </div>
          <button
            onClick={handleScrape}
            disabled={scraping || isOfflineMode}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {scraping ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scrape New Data
              </>
            )}
          </button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{question.text}</h1>
        
        {question.summary && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-indigo-800 mb-2">AI Summary</h2>
            <p className="text-gray-700">{question.summary}</p>
          </div>
        )}
      </div>

      {responses.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Scraped Answers</h2>
          <div className="space-y-4">
            {responses.map((response) => (
              <div key={response._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-indigo-600">{response.source}</span>
                  <a
                    href={response.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-500 hover:text-indigo-600"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View Source
                  </a>
                </div>
                <p className="text-gray-700">{response.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Comments ({comments.length})
        </h2>
        
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            Post Comment
          </button>
        </form>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="border-b border-gray-200 pb-4">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  {comment.userId.charAt(0).toUpperCase()}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-700">User {comment.userId}</p>
                  <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                </div>
              </div>
              <p className="text-gray-700">{comment.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestionPage;