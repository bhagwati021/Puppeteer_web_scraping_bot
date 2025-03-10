import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ThumbsUp, ExternalLink, RefreshCw, ArrowLeft } from 'lucide-react';

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

const QuestionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>('');
  const [scraping, setScraping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [serverUnavailable, setServerUnavailable] = useState<boolean>(false);

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        // Create a timeout promise to handle API timeouts
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 5000);
        });

        // If we're in demo mode (no server) and using a mock ID, load mock data
        if (id === '1' || id === '2' || id === '3') {
          // Mock data for demonstration when server is not available
          const mockQuestions = {
            '1': {
              _id: '1',
              text: 'How do I implement authentication in a MERN stack application?',
              category: 'programming',
              createdAt: new Date().toISOString(),
              summary: 'Use JWT tokens for authentication in MERN stack. Store tokens in HTTP-only cookies or localStorage, implement middleware for protected routes, and use bcrypt for password hashing.'
            },
            '2': {
              _id: '2',
              text: 'What are the best practices for React state management in 2025?',
              category: 'programming',
              createdAt: new Date().toISOString(),
              summary: 'Modern React state management in 2025 favors React Query for server state, Zustand for global state, and Context API with useReducer for complex component state. Consider the trade-offs between simplicity and performance.'
            },
            '3': {
              _id: '3',
              text: 'How does quantum computing affect cryptography?',
              category: 'technology',
              createdAt: new Date().toISOString(),
              summary: 'Quantum computing threatens current cryptographic methods by potentially breaking RSA and ECC through Shor\'s algorithm. Post-quantum cryptography is being developed to create quantum-resistant algorithms.'
            }
          };

          const mockResponses = {
            '1': [
              {
                _id: 'r1',
                questionId: '1',
                source: 'Stack Overflow',
                content: 'For MERN authentication, use JWT tokens stored in HTTP-only cookies. Implement middleware to verify tokens on protected routes. Use bcrypt to hash passwords before storing them in MongoDB. Consider refresh tokens for better security. Always validate user input and implement rate limiting to prevent brute force attacks.',
                url: 'https://stackoverflow.com/questions/12345678',
                createdAt: new Date().toISOString()
              },
              {
                _id: 'r2',
                questionId: '1',
                source: 'Quora',
                content: 'I recommend using Passport.js with JWT strategy for MERN authentication. It provides a clean abstraction and supports multiple authentication methods. Store user data in MongoDB with proper indexing. Use environment variables for secrets and consider implementing 2FA for sensitive applications.',
                url: 'https://quora.com/How-do-I-implement-authentication',
                createdAt: new Date().toISOString()
              }
            ],
            '2': [
              {
                _id: 'r3',
                questionId: '2',
                source: 'Stack Overflow',
                content: 'In 2025, the React ecosystem has evolved significantly. For most applications, React Query handles server state beautifully. For global state, Zustand offers simplicity without the boilerplate of Redux. Context API with useReducer works well for complex component state. Always consider performance implications and use the right tool for your specific needs.',
                url: 'https://stackoverflow.com/questions/87654321',
                createdAt: new Date().toISOString()
              }
            ],
            '3': [
              {
                _id: 'r4',
                questionId: '3',
                source: 'Quora',
                content: 'Quantum computing poses a significant threat to current cryptographic methods. Shor\'s algorithm, when implemented on a sufficiently powerful quantum computer, could break RSA and ECC encryption. The cryptographic community is developing post-quantum cryptography algorithms that are resistant to quantum attacks. NIST is currently standardizing several promising candidates.',
                url: 'https://quora.com/quantum-cryptography',
                createdAt: new Date().toISOString()
              }
            ]
          };

          const mockComments = {
            '1': [
              {
                _id: 'c1',
                userId: 'user1',
                questionId: '1',
                text: 'I found this very helpful! I implemented JWT with HTTP-only cookies and it works great.',
                createdAt: new Date().toISOString()
              }
            ],
            '2': [
              {
                _id: 'c2',
                userId: 'user2',
                questionId: '2',
                text: 'I\'ve been using Zustand and it\'s so much simpler than Redux!',
                createdAt: new Date().toISOString()
              }
            ],
            '3': []
          };

          setQuestion(mockQuestions[id as keyof typeof mockQuestions]);
          setResponses(mockResponses[id as keyof typeof mockResponses] || []);
          setComments(mockComments[id as keyof typeof mockComments] || []);
          setServerUnavailable(true);
          setLoading(false);
          return;
        }

        // Create the actual API request
        const questionPromise = axios.get(`http://localhost:5000/api/questions/${id}`);
        
        // Race the API request against the timeout
        const questionResponse = await Promise.race([questionPromise, timeoutPromise]) as any;
        
        // Ensure we're only storing serializable data
        const questionData = questionResponse.data.question;
        setQuestion({
          _id: questionData._id,
          text: questionData.text,
          category: questionData.category,
          createdAt: questionData.createdAt,
          summary: questionData.summary || null
        });
        
        // Serialize response data
        const responseData = questionResponse.data.responses.map((r: any) => ({
          _id: r._id,
          questionId: r.questionId,
          source: r.source,
          content: r.content,
          url: r.url,
          createdAt: r.createdAt
        }));
        setResponses(responseData);
        
        const commentsPromise = axios.get(`http://localhost:5000/api/comments/question/${id}`);
        const commentsResponse = await Promise.race([commentsPromise, timeoutPromise]) as any;
        
        // Serialize comment data
        const commentData = commentsResponse.data.map((c: any) => ({
          _id: c._id,
          userId: c.userId,
          questionId: c.questionId,
          text: c.text,
          createdAt: c.createdAt
        }));
        setComments(commentData);
        
        setLoading(false);
      } catch (error) {
        if (error instanceof Error && (error.message.includes('Network Error') || error.message.includes('timed out'))) {
          setError("Server connection failed. Please start the backend server.");
          setServerUnavailable(true);
        } else {
          setError("Failed to fetch question data. Please try again later.");
        }
        console.error('Error fetching question data:', error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    };

    if (id) {
      fetchQuestionData();
    }
  }, [id]);

  const handleScrape = async () => {
    if (!id) return;
    
    setScraping(true);
    setError(null);
    try {
      if (serverUnavailable) {
        // Simulate scraping in demo mode
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Add a new mock response
        const newResponse = {
          _id: `r${Date.now()}`,
          questionId: id,
          source: Math.random() > 0.5 ? 'Stack Overflow' : 'Quora',
          content: 'This is a newly scraped answer that provides additional insights into your question. In a real application, this would be actual content from the web.',
          url: 'https://example.com/scraped-answer',
          createdAt: new Date().toISOString()
        };
        
        setResponses([...responses, newResponse]);
        
        // Update the question summary
        if (question) {
          setQuestion({
            ...question,
            summary: 'Updated summary based on newly scraped content. This demonstrates how the AI would summarize multiple sources into a cohesive answer.'
          });
        }
      } else {
        await axios.post(`http://localhost:5000/api/scraping/scrape/${id}`);
        
        // Refresh the data
        const questionResponse = await axios.get(`http://localhost:5000/api/questions/${id}`);
        const questionData = questionResponse.data.question;
        setQuestion({
          _id: questionData._id,
          text: questionData.text,
          category: questionData.category,
          createdAt: questionData.createdAt,
          summary: questionData.summary || null
        });
        
        const responseData = questionResponse.data.responses.map((r: any) => ({
          _id: r._id,
          questionId: r.questionId,
          source: r.source,
          content: r.content,
          url: r.url,
          createdAt: r.createdAt
        }));
        setResponses(responseData);
      }
    } catch (error) {
      setError("Failed to scrape data. Please try again later.");
      console.error('Error scraping data:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setScraping(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    
    try {
      if (serverUnavailable) {
        // In demo mode, just add the comment locally
        const newCommentData = {
          _id: `c${Date.now()}`,
          userId: "demo-user-id",
          questionId: id,
          text: newComment,
          createdAt: new Date().toISOString()
        };
        
        setComments([...comments, newCommentData]);
      } else {
        // In a real app, you'd get the userId from auth context
        const userId = "placeholder-user-id";
        
        const response = await axios.post('http://localhost:5000/api/comments', {
          userId,
          questionId: id,
          text: newComment
        });
        
        // Ensure we're only storing serializable data
        const newCommentData = {
          _id: response.data._id,
          userId: response.data.userId,
          questionId: response.data.questionId,
          text: response.data.text,
          createdAt: response.data.createdAt
        };
        
        setComments([...comments, newCommentData]);
      }
      
      setNewComment('');
    } catch (error) {
      console.error('Error posting comment:', error instanceof Error ? error.message : 'Unknown error');
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

  if (error && !question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-700 mb-4">{error}</p>
          {serverUnavailable && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                The backend server is not running. You can:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-600 mb-4">
                <li className="mb-1">Start the server with <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:server</code></li>
                <li className="mb-1">Or view demo questions below</li>
              </ol>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Link to="/question/1" className="bg-white p-4 rounded-lg shadow hover:shadow-md">
                  <h3 className="font-medium text-indigo-600">MERN Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">How to implement auth in MERN stack</p>
                </Link>
                <Link to="/question/2" className="bg-white p-4 rounded-lg shadow hover:shadow-md">
                  <h3 className="font-medium text-indigo-600">React State Management</h3>
                  <p className="text-sm text-gray-600 mt-1">Best practices for 2025</p>
                </Link>
                <Link to="/question/3" className="bg-white p-4 rounded-lg shadow hover:shadow-md">
                  <h3 className="font-medium text-indigo-600">Quantum Cryptography</h3>
                  <p className="text-sm text-gray-600 mt-1">Impact on security</p>
                </Link>
              </div>
            </div>
          )}
          <div className="flex justify-center space-x-4">
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-gray-800">Question not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {serverUnavailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center mb-6">
          <p className="text-yellow-700">
            <strong>Demo Mode:</strong> Server connection failed. Showing demo data.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            To see real data, start the server with <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:server</code>
          </p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
              {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
            </span>
            <span className="ml-2 text-sm text-gray-500">
              Asked on {formatDate(question.createdAt)}
            </span>
          </div>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          >
            {scraping ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Scrape Answers
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center mb-6">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {responses.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Scraped Answers</h2>
          <div className="space-y-4">
            {responses.map((response) => (
              <div key={response._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-indigo-600">{response.source}</span>
                  <a 
                    href={response.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-gray-500 hover:text-indigo-600"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Source
                  </a>
                </div>
                <div className="prose max-w-none">
                  <p className="text-gray-700">{response.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center mb-8">
          <p className="text-gray-600">No answers have been scraped yet.</p>
          <p className="mt-2 text-gray-500">Click "Scrape Answers" to find solutions from across the web.</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Comments</h2>
        
        {comments.length > 0 ? (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment._id} className="border-b border-gray-200 pb-4">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 font-bold">
                    U
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-700">User</p>
                    <p className="text-xs text-gray-500">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                <p className="text-gray-700">{comment.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 mb-6">No comments yet. Be the first to comment!</p>
        )}
        
        <form onSubmit={handleCommentSubmit}>
          <div className="mb-4">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
              Add a comment
            </label>
            <textarea
              id="comment"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Share your thoughts..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            ></textarea>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Post Comment
          </button>
        </form>
      </div>
    </div>
  );
};

export default QuestionPage;