import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Topic from './pages/Topic';
import CreateTopic from './pages/CreateTopic';
import Navbar from './components/Navbar';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topic/:id" element={<Topic />} />
        <Route path="/create-topic" element={<CreateTopic />} />
      </Routes>
    </Router>
  );
}

export default App;
