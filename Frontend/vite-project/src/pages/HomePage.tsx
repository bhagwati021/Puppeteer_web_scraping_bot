import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ThumbsUp, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category?: string;
  createdAt: string;
  summary?: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  userId: string;
}

// Dummy data for offline mode
const dummyQuestions: Question[] = [
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
    category: 'technology',
    createdAt: new Date().toISOString(),
    summary: 'Modern React state management favors React Query for server state, Zustand for global state, and Context API with useReducer for complex component state.'
  },
  {
    _id: '3',
    text: 'How does quantum computing affect cryptography?',
    category: 'science',
    createdAt: new Date().toISOString(),
    summary: 'Quantum computing poses challenges to current cryptographic methods through Shor\'s algorithm. Post-quantum cryptography is being developed to address these concerns.'
  }
];

const dummyComments: Record<string, Comment[]> = {
  '1': [
    {
      _id: 'c1',
      text: 'JWT with HTTP-only cookies is definitely the way to go!',
      createdAt: new Date().toISOString(),
      userId: 'user1'
    }
  ],
  '2': [
    {
      _id: 'c2',
      text: 'Zustand has been a game-changer for my projects',
      createdAt: new Date().toISOString(),
      userId: 'user2'
    }
  ]
};

const HomePage: React.FC = () => {
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'programming', name: 'Programming' },
    { id: 'technology', name: 'Technology' },
    { id: 'science', name: 'Science' },
    { id: 'health', name: 'Health' },
    { id: 'education', name: 'Education' },
  ];

  useEffect(() => {
    fetchQuestions();
  }, [activeCategory]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const apiPromise = axios.get(
        `http://localhost:5000/api/questions${activeCategory !== 'all' ? `?category=${activeCategory}` : ''}`
      );
      const response = await apiPromise;

      const serializedQuestions = response.data.map((q: any) => ({
        _id: q._id,
        text: q.text,
        category: q.category ?? 'uncategorized',
        createdAt: q.createdAt,
        summary: q.summary ?? null,
      }));

      setQuestions(serializedQuestions);
      setError(null);
      setIsOfflineMode(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching questions:', error.message);
      } else {
        console.error('Unknown error occurred');
      }
      // Load dummy data if server is unavailable
      setIsOfflineMode(true);
      const filteredDummyQuestions = activeCategory === 'all' 
        ? dummyQuestions 
        : dummyQuestions.filter(q => q.category === activeCategory);
        console.log('Filtered Dummy Questions:', filteredDummyQuestions);
      setQuestions(filteredDummyQuestions);
      setComments(dummyComments);
      setError('Server connection failed. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (questionId: string) => {
    if (isOfflineMode) {
      setComments(dummyComments);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/comments/question/${questionId}`);
      setComments((prev) => ({ ...prev, [questionId]: response.data }));
    } catch (error: unknown) {
      if (error instanceof Error) {
      console.error('Error fetching comments:', error.message);
      alert('Failed to Fetch Comments. Please try again later.');
    } else {
      console.error('Unknown error occurred while fetching Comments');
    }
    }
  };

  const toggleComments = (questionId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));

    if (!comments[questionId]) {
      fetchComments(questionId);
    }
  };

  const triggerScraping = async (questionId: string) => {
    if (isOfflineMode) {
      alert('Scraping is not available in demo mode');
      return;
    }

    try {
      const { data } = await axios.post(`http://localhost:5000/api/scraping/scrape/${questionId}`);
      alert(`Scraping completed: ${data.responseCount} responses. Summary: ${data.summary || 'None available'}`);
      fetchQuestions();
    } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error triggering scraping:', error.message);
      alert('Failed to start scraping. Please try again later.');
    } else {
      console.error('Unknown error occurred while triggering scraping');
    }
  }
  };

  const addComment = async (questionId: string, text: string) => {
    if (isOfflineMode) {
      const newComment: Comment = {
        _id: `c${Date.now()}`,
        text,
        createdAt: new Date().toISOString(),
        userId: 'demo-user'
      };
      setComments(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), newComment]
      }));
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/comments`, { userId: 'user123', questionId, text });
      fetchComments(questionId);
    } catch (error:unknown) {
      if (error instanceof Error) {
        console.error('Error adding comment:', error.message);
        alert('Error adding comment. Please try again later.');
      } else {
        console.error('Unknown error occurred while adding comments');
      }
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (isOfflineMode) {
      setQuestions(prev => prev.filter(q => q._id !== questionId));
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/questions/${questionId}`);
      setQuestions((prevQuestions) => prevQuestions.filter((q) => q._id !== questionId));
    } catch (error:unknown) {
      if (error instanceof Error) {
      console.error('Error deleting question:', error.message);
      alert('Failed to delete question. Please try again later.');
      } else{
        console.error('Unknown error occurred while deleting question');
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredQuestions = activeCategory === 'all' ? questions : questions.filter((q) => q.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto">
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
        {categories.map((category) => (
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
      ) : error && !isOfflineMode ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
          <p className="text-yellow-700">{error}</p>
          <button
            onClick={fetchQuestions}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <div key={question._id} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center mb-2">
                  <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                    {question.category
                      ? question.category.charAt(0).toUpperCase() + question.category.slice(1)
                      : 'Uncategorized'}
                  </span>
                  <span className="ml-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(question.createdAt)}
                  </span>
                </div>
                <Link to={`/question/${question._id}`}>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:text-indigo-600 transition-colors">
                    {question.text}
                  </h2>
                </Link>
                {question.summary && <p className="text-gray-600 mb-4 line-clamp-2">{question.summary}</p>}
                <div className="flex items-center text-gray-500">
                  <div className="flex items-center mr-4">
                    <MessageCircle className="h-5 w-5 mr-1" />
                    <span>{comments[question._id]?.length || 0} comments</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsUp className="h-5 w-5 mr-1" />
                    <span>5 likes</span>
                  </div>
                </div>
                <div className="mt-4 space-x-4">
                  <button
                    onClick={() => triggerScraping(question._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Scrape Data
                  </button>
                  <button
                    onClick={() => toggleComments(question._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {expanded[question._id] ? (
                      <>
                        Hide Comments <ChevronUp className="inline h-4 w-4" />
                      </>
                    ) : (
                      <>
                        View Comments <ChevronDown className="inline h-4 w-4" />
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteQuestion(question._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Post
                  </button>
                </div>
              </div>
              {expanded[question._id] && (
                <div className="p-4 bg-gray-50">
                  {comments[question._id]?.map((comment) => (
                    <div key={comment._id} className="mb-4 p-3 bg-white rounded-lg shadow-sm">
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
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value.trim()) {
                          addComment(question._id, input.value);
                          input.value = '';
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;