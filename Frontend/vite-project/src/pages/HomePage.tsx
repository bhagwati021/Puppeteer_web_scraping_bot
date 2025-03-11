import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { MessageCircle, ThumbsUp, Clock } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category?: string; // Marked as optional to prevent potential issues
  createdAt: string;
  summary?: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  userId: string;
}

const HomePage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});

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
    } catch (error) {
      console.error('Error fetching questions:', error.message);
      setError('Failed to fetch questions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (questionId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/comments/question/${questionId}`);
      setComments((prev) => ({ ...prev, [questionId]: response.data }));
    } catch (error) {
      console.error('Error fetching comments:', error.message);
    }
  };

  const triggerScraping = async (questionId: string) => {
    try {
      const { data } = await axios.post(`http://localhost:5000/api/scrape/${questionId}`);
      alert(`Scraping completed: ${data.responseCount} responses. Summary: ${data.summary || 'None available'}`);
      fetchQuestions(); // Refresh questions to reflect updates
    } catch (error) {
      console.error('Error triggering scraping:', error.message);
      alert('Failed to start scraping. Please try again later.');
    }
  };

  const addComment = async (questionId: string, text: string) => {
    try {
      await axios.post(`http://localhost:5000/api/comments`, { userId: 'user123', questionId, text });
      fetchComments(questionId); // Refresh comments
    } catch (error) {
      console.error('Error adding comment:', error.message);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    try {
      const response = await axios.delete(`http://localhost:5000/api/questions/${questionId}`);
      // alert(response.data.message); // Notify user of successful deletion
      setQuestions((prevQuestions) => prevQuestions.filter((q) => q._id !== questionId)); // Update state
    } catch (error) {
      console.error('Error deleting question:', error.message);
      alert('Failed to delete question. Please try again later.');
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
      ) : error ? (
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
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{question.text}</h2>
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
                    onClick={() => fetchComments(question._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    View Comments
                  </button>
                  <button
                    onClick={() => deleteQuestion(question._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete Post
                  </button>
                
                </div>
              </div>
              {comments[question._id] && (
                <div className="p-4 bg-gray-50">
                  {comments[question._id].map((comment) => (
                    <div key={comment._id} className="mb-2">
                      <p className="text-gray-700">{comment.text}</p>
                      <p className="text-sm text-gray-500">{formatDate(comment.createdAt)}</p>
                    </div>
                  ))}
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    className="w-full px-3 py-2 border rounded-md"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addComment(question._id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
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
