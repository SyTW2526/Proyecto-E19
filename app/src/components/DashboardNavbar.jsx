import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useNavigation } from '../contexts/NavigationContext';

const DashboardNavbar = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { currentSection, navigateToSection } = useNavigation();

  const handleLogout = async () => {
    await axios.post("http://localhost:4000/api/auth/logout");
    setUser(null);
    navigate("/");
  };

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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:pr-8 text-gray-800 flex items-center justify-between z-50">
      {/* Logo y buscador */}
      <div className="flex items-center gap-3 sm:gap-6 lg:gap-10 xl:gap-17">
        <div className="flex items-center gap-2 text-base sm:text-lg lg:text-xl font-bold text-gray-800">
          <span className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-[#7024BB] rounded-full flex items-center justify-center text-white text-base sm:text-lg lg:text-xl font-extrabold">U</span>
          <span className="hidden sm:inline">ULL CALENDAR</span>
        </div>
        
        {/* Buscador */}
        <div className="hidden md:flex items-center relative">
          <svg className="absolute left-3 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar tutorías, espacios..."
            className="pl-9 lg:pl-10 pr-3 lg:pr-4 py-1.5 lg:py-2 w-48 lg:w-64 xl:w-80 border border-gray-300 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Menú de navegación central - pegado a la derecha */}
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 xl:gap-8">
        <div className="hidden lg:flex items-center gap-3 xl:gap-8">
          <button 
            onClick={() => navigateToSection('dashboard')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              currentSection === 'dashboard' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => navigateToSection('tutorias')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              currentSection === 'tutorias' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Tutorías
          </button>
          <button 
            onClick={() => navigateToSection('espacios')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              currentSection === 'espacios' 
                ? 'text-[#7024BB] border-b-2 border-[#7024BB]' 
                : 'text-gray-800 hover:text-[#7024BB]'
            }`}
          >
            Reserva de espacios
          </button>
          <button 
            onClick={() => navigateToSection('calendario')}
            className={`text-xs lg:text-sm xl:text-base font-semibold transition-colors py-2 px-1.5 lg:px-2 ${
              currentSection === 'calendario' 
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
              <button
                onClick={() => {
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-3 text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Configuración</span>
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
