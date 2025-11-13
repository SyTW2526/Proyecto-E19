import React, { useState } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import axios from 'axios';
import { useEffect } from 'react';

axios.defaults.withCredentials = true;

function App() {
  const [output, setOutput] = useState('')
  // Creamos user pero no lo usamos aún
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async() => {
      try {
        const res = await axios.get("http://localhost:4000/api/auth/me")
        setUser(res.data);
      } catch(err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:4000/api/auth/login", form);
      setUser(res.data);
    }  catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Navbar user={user} setUser={setUser}/>
        <Routes> 
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser}/>} />
        </Routes>
    </Router>
  );
}

export default App; 