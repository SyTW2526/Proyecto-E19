import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home({ setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:4000/api/auth/logout');
    } catch (e) {
      // ignore errors
    }
    if (setUser) setUser(null);
    navigate('/login');
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'violet', padding: '1rem' }}>ULL CALENDAR</h1>
      <div className="top-right">
        <button className="hero-logout" onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  );
}

export default Home;

