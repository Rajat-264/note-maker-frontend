import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const topicRes = await API.get('/topics');
        setTopics(topicRes.data);
        setFilteredTopics(topicRes.data); // Initially show all
        const userRes = await API.get('/auth/me');
        setUser(userRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term === '') {
      setFilteredTopics(topics);
    } else {
      setFilteredTopics(
        topics.filter((topic) =>
          topic.title.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, topics]);

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

        <div className="search-container">
          <input
            type="text"
            placeholder="Search topics..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="topic-container">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => (
              <div
                key={topic._id}
                onClick={() => navigate(`/topic/${topic._id}`)}
                className="div"
              >
                <h2 className="topics">{topic.title}</h2>
              </div>
            ))
          ) : (
            <p className="no-results">No topics found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
