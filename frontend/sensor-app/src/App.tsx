import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    const storedDevices = localStorage.getItem('devices');
    if (storedDevices) {
      setDevices(JSON.parse(storedDevices));
    }
  }, []);

  const handleSetToken = (newToken: string | null, userDevices?: string[]) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      if (userDevices) {
        localStorage.setItem('devices', JSON.stringify(userDevices));
        setDevices(userDevices);
      }
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('devices');
      setDevices([]);
    }
    setToken(newToken);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setToken={handleSetToken} />} />
        <Route path="/signup" element={<Signup setToken={handleSetToken} />} />
        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard token={token} setToken={handleSetToken} devices={devices} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
};

export default App;