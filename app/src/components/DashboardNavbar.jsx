import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useNavigation } from '../contexts/NavigationContext';

const DashboardNavbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentSection, navigateToSection } = useNavigation();

  const handleLogout = async () => {
    await axios.post("https://proyecto-e19.onrender.com/api/auth/logout");
    setUser(null);
    navigate("/");
  };

  // Función auxiliar para navegar y actualizar el contexto si es necesario
  const handleNavClick = (sectionName, path) => {
    // 1. Navega a la URL principal de la sección
    navigate(path);
    // 2. Opcionalmente, llama a navigateToSection para mantener el estado interno
    //    del dashboard sincronizado al regresar (aunque al cambiar de URL, el Dashboard se montará de nuevo)
    navigateToSection(sectionName);
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener inicial del nombre o email
  const getInitial = (user) => {
    if (user?.name) return user.name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  };

  // Determinar si estamos en una ruta especial (como perfil) donde no debe haber botones activos
  const isSpecialRoute = location.pathname === '/perfil';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:pr-8 text-gray-800 flex items-center justify-between z-50">
      {/* Logo y buscador */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-10 xl:gap-17">
        <div className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-bold text-gray-800">
          <span className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-[#7024BB] rounded-full flex items-center justify-center text-white text-base sm:text-lg lg:text-xl font-extrabold">U</span>
          <span className="hidden sm:inline">ULL CALENDAR</span>
        </div>
      </div>

      {/* Menú de navegación central - pegado a la derecha */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-8">
        <div className="hidden lg:flex items-center gap-3 xl:gap-8">
          <button 
            onClick={() => handleNavClick('dashboard', '/dashboard')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              !isSpecialRoute && currentSection === 'dashboard' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => handleNavClick('tutorias', '/dashboard')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              !isSpecialRoute && currentSection === 'tutorias' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Tutorías
          </button>
          <button 
            onClick={() => handleNavClick('espacios', '/dashboard')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              !isSpecialRoute && currentSection === 'espacios' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Reserva de espacios
          </button>
          <button 
            onClick={() => handleNavClick('calendario', '/dashboard')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              !isSpecialRoute && currentSection === 'calendario' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Calendario
          </button>
        </div>

        {/* Avatar y dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-[#7024BB] to-[#8e44e5] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:from-[#5f1da0] hover:to-[#7024BB] transition-all duration-200"
          >
            {getInitial(user)}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 animate-slideDown">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/perfil');
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Mi perfil</span>
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;