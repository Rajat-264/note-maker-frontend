import { useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function CreateTopic() {
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post('/topics', { title });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Create New Topic</h2>
        <input
          type="text"
          placeholder="Topic Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          Create Topic
        </button>
      </form>
    </div>
  );
}
