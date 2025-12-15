import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import DashboardNavbar from './components/DashboardNavbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import { NavigationProvider } from './contexts/NavigationContext';
import axios from 'axios';
import { getApiUrl } from './config/api';

axios.defaults.withCredentials = true;

function AppContent({ user, setUser, loading }) {
  const location = useLocation();
  
  // Rutas donde NO queremos mostrar el navbar
  const hideNavbarRoutes = ['/login', '/register'];
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-lg text-gray-600">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {shouldShowNavbar && (
        user ? <DashboardNavbar user={user} setUser={setUser} /> : <Navbar user={user} setUser={setUser} />
      )}
      <Routes>
        <Route path="/" element={<Home setUser={setUser} />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
        <Route path="/perfil" element={user ? <Perfil user={user} /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </div>
  );
}

function App() {
  const [output, setOutput] = useState('')
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async() => {
      try {
        const res = await fetchApi('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          setUser(null);
        }
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
      const res = await axios.post(getApiUrl('/api/auth/login'), form);
      setUser(res.data);
    }  catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  }

  return (
    <Router>
      <NavigationProvider>
        <AppContent user={user} setUser={setUser} loading={loading} />
      </NavigationProvider>
    </Router>
  );
}

export default App;