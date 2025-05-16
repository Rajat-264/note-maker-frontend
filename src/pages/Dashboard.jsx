import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [topics, setTopics] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/topics').then((res) => setTopics(res.data));

    API.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch((err) => console.error('Failed to fetch user:', err));
  }, []);

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        {user && (
          <h1 className="user">
            👋 Welcome, <span className="font-semibold">{user.name}</span>
          </h1>
        )}

        <button
          onClick={() => navigate('/create-topic')}
          className="button"
        >
          + Create New Topic
        </button>

        <h2 className="topic">Your Topics</h2>

        <div className="topic-container">
          {topics.map((topic) => (
            <div
              key={topic._id}
              onClick={() => navigate(`/topic/${topic._id}`)}
              className="div"
            >
              <h2 className="topics">{topic.title}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
