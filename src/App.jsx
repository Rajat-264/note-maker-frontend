import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import Topic from './pages/Topic';
import CreateTopic from './pages/CreateTopic';
import Navbar from './components/navbar/Navbar';

const AppContent = () => {
  const location = useLocation();

  const noNavbarRoutes = ['/login','/', '/register'];

  const hideNavbar = noNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/topic/:id" element={<Topic />} />
        <Route path="/create-topic" element={<CreateTopic />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
