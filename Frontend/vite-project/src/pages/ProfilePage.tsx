import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { User, Clock, HelpCircle } from 'lucide-react';

interface Question {
  _id: string;
  text: string;
  category: string;
  createdAt: string;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you'd get this from your auth context
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Fetch user's questions
    // This is a mock implementation since we don't have a real endpoint yet
    const fetchUserQuestions = async () => {
      try {
        // In a real app, you'd call an API endpoint like:
        const response = await axios.get(`http://localhost:5000/api/questions/user/${userId}`);
        setQuestions(response.data);
        
        // Mock data for demonstration
        setQuestions([
          {
            _id: '1',
            text: 'How do I implement authentication in a MERN stack application?',
            category: 'programming',
            createdAt: new Date().toISOString()
          },
          {
            _id: '2',
            text: 'What are the best practices for React state management in 2025?',
            category: 'programming',
            createdAt: new Date().toISOString()
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user questions:', error);
        setLoading(false);
      }
    };
    
    fetchUserQuestions();
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center">
          <div className="h-20 w-20 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-600 text-2xl font-bold">
            <User className="h-10 w-10" />
          </div>
          <div className="ml-6">
            <h1 className="text-2xl font-bold text-gray-800">{user?.username || 'User'}</h1>
            <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
            <p className="text-sm text-gray-500">
              Member since {user?.createdAt ? formatDate(user.createdAt) : 'recently'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Your Questions</h2>
          <Link
            to="/ask"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Ask a Question
          </Link>
        </div>
        
        {questions.length > 0 ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link
                key={question._id}
                to={`/question/${question._id}`}
                className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center mb-2">
                  <span className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-100 rounded-full">
                    {question.category.charAt(0).toUpperCase() + question.category.slice(1)}
                  </span>
                  <span className="ml-2 flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(question.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 font-medium">{question.text}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No questions yet</h3>
            <p className="text-gray-500 mb-4">You haven't asked any questions yet.</p>
            <Link
              to="/ask"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Ask Your First Question
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;