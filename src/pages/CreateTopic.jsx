import { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './CreateTopic.css';

export default function CreateTopic() {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post('/topics', { title });
    navigate('/dashboard');
  };

  return (
    <div className="create-topic-page">
      <form onSubmit={handleSubmit} className="form">
        <h2 className="text-2xl font-bold mb-4 text-center">Create New Topic</h2>
        <input
          type="text"
          placeholder="Topic Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-box"
          required
        />
        <button type="submit" className="button">
          Create Topic
        </button>
      </form>
    </div>
  );
}
