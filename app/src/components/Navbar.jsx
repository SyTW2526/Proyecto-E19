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
    <nav className="bg-gray-800 p-4 text-white justify-between felx items-center "> 
      {/* <Link to="/">
        Autenticación
      </Link> */}
      <div>
        {user ? (
          <button  
            onClick={handleLogout}
            className= "bg-red-500 px-3 py-1 rounded">
            Cerrar sesión
          </button>
        ) : (
          <>
            <Link to="/login">
              Iniciar sesión
            </Link>
            <Link to="/register">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;