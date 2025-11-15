import React from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Navbar = ({user, setUser}) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
      await axios.post("http://localhost:4000/api/auth/logout");
      setUser(null);
      navigate("/");
  };
  
  
  
  return (
    <nav className="bg-gray-800 p-4 text-white flex items-center justify-between"> 
      <div className="flex items-center nav-brand">
        <Link to="/" className="brand-link">
          <span className="nav-logo">U</span>
          <span className="nav-title">ULL CALENDAR</span>
        </Link>
      </div>

      <div className="flex items-center space-x-3">
        {user ? (
          <button
            onClick={handleLogout}
            className="bg-red-500 px-3 py-1 rounded">
            Cerrar sesión
          </button>
        ) : (
          <>
            <Link to="/login" className="px-3 py-1 hover:underline">
              Iniciar sesión
            </Link>
            <Link to="/register" className="px-3 py-1 hover:underline">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;