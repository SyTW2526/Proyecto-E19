import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Navbar = ({user, setUser}) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const dropdownRef = useRef(null);
  const navDropdownRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const handleLogout = async () => {
      await axios.post("https://proyecto-e19.onrender.com/api/auth/logout");
      setUser(null);
      navigate("/");
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (navDropdownRef.current && !navDropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
        setActiveCourse(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Menú de navegación para usuarios logueados
  const loggedInMenuSections = [
    { title: 'Tutorías', hasItems: false },
    { title: 'Dashboard', hasItems: false },
    { title: 'Reserva de espacios', hasItems: false },
    { title: 'Calendario', hasItems: false }
  ];

  // Menú de navegación público (Home)
  const publicMenuSections = [
    { 
      title: 'Asignaturas', 
      hasItems: true,
      items: [
        { 
          label: 'Curso 1', 
          subitems: [
            'Primer cuatrimestre',
            '139261011 - Informática Básica',
            '139261012 - Álgebra',
            '139261013 - Cálculo',
            '139261014 - Fundamentos Físicos para la Ingeniería',
            '139261015 - Organizaciones Empresariales',
            'Segundo cuatrimestre',
            '139261021 - Algoritmos y Estructuras de Datos',
            '139261022 - Principios de Computadores',
            '139261023 - Optimización',
            '139261024 - Sistemas Electrónicos Digitales',
            '139261025 - Expresión Gráfica en Ingeniería'
          ]
        },
        { 
          label: 'Curso 2', 
          subitems: [
            'Primer cuatrimestre',
            '139262011 - Estadística',
            '139262012 - Computabilidad y Algoritmia',
            '139262013 - Estructura de Computadores',
            '139262014 - Sistemas Operativos',
            '139262015 - Inglés Técnico',
            'Segundo cuatrimestre',
            '139262021 - Algoritmos y Estructuras de Datos Avanzadas',
            '139262022 - Redes y Sistemas Distribuidos',
            '139262023 - Administración de Sistemas',
            '139262024 - Fundamentos de Ingeniería del Software',
            '139262025 - Código Deontológico y Aspectos Legales'
          ]
        },
        { 
          label: 'Curso 3', 
          subitems: [
            'Primer cuatrimestre',
            '139263011 - Bases de Datos',
            '139263012 - Inteligencia Artificial',
            '139263013 - Sistemas de Interacción Persona-Computador',
            '139263014 - Lenguajes y Paradigmas de Programación',
            '139263015 - Gestión de Proyectos Informáticos',
            'Segundo cuatrimestre',
            '139263121 - Procesadores de Lenguajes',
            '139263122 - Diseño y Análisis de Algoritmos',
            '139263123 - Programación de Aplicaciones Interactivas',
            '139263124 - Inteligencia Artificial Avanzada',
            '139263125 - Tratamiento Inteligente de Datos',
            '139263221 - Diseño de Procesadores',
            '139263222 - Arquitectura de Computadores',
            '139263225 - Sistemas Operativos Avanzados',
            '139263226 - Redes de Computadores en Ingeniería de Computadores',
            '139263227 - Laboratorio de Redes en Ingeniería de Computadores'
          ]
        },
        { 
          label: 'Curso 4', 
          subitems: [
            'Primer cuatrimestre',
            '139260901 - Administración y Diseño de Bases de Datos',
            '139260902 - Visión por Computador',
            '139264111 - Interfaces Inteligentes',
            '139264112 - Sistemas Inteligentes',
            '139264211 - Sistemas Empotrados',
            '139264311 - Laboratorio de Desarrollo y Herramientas',
            'Segundo cuatrimestre',
            '139264021 - Inteligencia Emocional',
            '139264022 - Prácticas Externas',
            '139264023 - Trabajo de Fin de Grado'
          ]
        }
      ]
    },
    { 
      title: 'Profesores', 
      hasItems: true,
      items: [
        { 
          label: '', 
          subitems: [
            'ABREU RODRÍGUEZ, DAVID',
            'ACOSTA SANCHEZ, LEOPOLDO',
            'ALAYON MIRANDA, SILVIA',
            'ARNAY DEL ARCO, RAFAEL',
            'BACALLADO LÓPEZ, MANUEL ALEJANDRO',
            'BARRETO PESTANA, CLEMENTE',
            'BRITO SANTANA, JULIO ANTONIO',
            'CABALLERO GIL, PINO TERESA',
            'CASTELLANOS NIEVES, DAGOBERTO',
            'COLEBROOK SANTAMARIA, MARCOS ALEJANDRO'
          ]
        },
        { 
          label: '', 
          subitems: [
            'GARCIA BAEZ, PATRICIO',
            'GONZALEZ GONZALEZ, EVELIO JOSE',
            'GONZALEZ PLATAS, JAVIER',
            'HERNANDEZ ACEITUNO, JAVIER',
            'HERNANDEZ GOYA, MARIA CANDELARIA',
            'JORGE SANTISO, JESUS MANUEL',
            'LEON HERNANDEZ, COROMOTO ANTONIA',
            'LOPEZ DE VERGARA MENDEZ, ALEJANDRO',
            'MARTIN GALAN, CARLOS ALBERTO',
            'MELIAN BATISTA, MARIA BELEN'
          ]
        },
        { 
          label: '', 
          subitems: [
            'MORENO PEREZ, JOSE ANDRES',
            'MORENO VEGA, JOSE MARCOS',
            'PEREZ BRITO, DIONISIO',
            'RODRIGUEZ GONZALEZ, FRANCISCO JAVIER',
            'RODRIGUEZ LEON, CASIANO',
            'SALAZAR GONZALEZ, JUAN JOSE',
            'SANCHEZ NIELSEN, MARIA ELENA',
            'SEGREDO GONZALEZ, EDUARDO MANUEL',
            'SIGUT SAAVEDRA, MARTA',
            'TOLEDO DELGADO, PEDRO A.'
          ]
        }
      ]
    },
    { title: 'Preguntas Frecuentes', hasItems: false },
    { title: 'Sobre nosotros', hasItems: false }
  ];

  // Seleccionar el menú apropiado según si el usuario está logueado
  const menuSections = user ? loggedInMenuSections : publicMenuSections;

  // Obtener inicial del nombre o email
  const getInitial = (user) => {
    if (!user) return 'U';
    const name = user.name || user.email;
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };
  
  
  
  return (
    <nav className="bg-white py-2 sm:py-3 lg:py-4 px-3 sm:px-4 md:px-6 lg:px-8 text-gray-800 flex items-center justify-between shadow-md"> 
      <div className="flex items-center nav-brand">
        <Link to="/" className="flex items-center gap-2 md:gap-3 text-lg md:text-xl font-bold text-gray-800 hover:text-[#7024BB] transition-colors">
          <span className="w-8 h-8 md:w-10 md:h-10 bg-[#7024BB] rounded-full flex items-center justify-center text-white text-lg md:text-xl font-extrabold">U</span>
          <span className="hidden sm:inline">ULL CALENDAR</span>
        </Link>
      </div>

      <div className="flex items-center gap-4 md:gap-8">
        {/* Menú de navegación - oculto en móvil */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-8">
          {menuSections.map((section, idx) => (
            <div key={idx} className="relative" ref={idx === 0 ? navDropdownRef : null}>
              <button
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setActiveDropdown(idx);
                  if (idx === 0) setActiveCourse(0);
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(() => {
                    setActiveDropdown(null);
                    setActiveCourse(null);
                  }, 300);
                }}
                className="text-sm xl:text-base font-semibold text-gray-800 hover:text-[#7024BB] transition-colors py-2 px-2"
              >
                {section.title}
              </button>

            {activeDropdown === idx && section.hasItems && (
              <div 
                onMouseEnter={() => {
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                  setActiveDropdown(idx);
                  if (idx === 0 && activeCourse === null) setActiveCourse(0);
                }}
                onMouseLeave={() => {
                  closeTimeoutRef.current = setTimeout(() => {
                    setActiveDropdown(null);
                    setActiveCourse(null);
                  }, 300);
                }}
                className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slideDown"
                style={{ 
                  minWidth: idx === 0 ? '620px' : '800px',
                  padding: '1.25rem'
                }}
              >
                {idx === 0 ? (
                  // Menú para Asignaturas con submenu de cursos
                  <div style={{ display: 'flex', gap: '0' }}>
                    {/* Lista de cursos a la izquierda */}
                    <div style={{ minWidth: '190px', borderRight: '1px solid #e5e7eb' }}>
                      {section.items.map((course, courseIdx) => (
                        <div
                          key={courseIdx}
                          onMouseEnter={() => setActiveCourse(courseIdx)}
                          onClick={() => setActiveCourse(courseIdx)}
                          className="px-4 py-2.5 cursor-pointer transition-all"
                          style={{
                            backgroundColor: activeCourse === courseIdx ? '#f3f4f6' : 'white',
                            fontWeight: activeCourse === courseIdx ? '600' : '500',
                            color: activeCourse === courseIdx ? '#7024BB' : '#374151',
                            borderLeft: activeCourse === courseIdx ? '3px solid #7024BB' : '3px solid transparent',
                            fontSize: '0.95rem'
                          }}
                        >
                          {course.label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Asignaturas del curso seleccionado a la derecha */}
                    {activeCourse !== null && (
                      <div style={{ padding: '0.5rem 1rem', minWidth: '430px', maxHeight: '500px', overflowY: 'auto' }}>
                        {section.items[activeCourse].subitems.map((subitem, subIdx) => {
                          const isSectionTitle = subitem.includes('cuatrimestre');
                          return (
                            <div
                              key={subIdx}
                              className="transition-colors"
                              style={{
                                padding: isSectionTitle ? '0.6rem 0 0.35rem' : '0.35rem 0',
                                fontWeight: isSectionTitle ? '700' : '400',
                                color: isSectionTitle ? '#1f2937' : '#6b7280',
                                fontSize: isSectionTitle ? '0.95rem' : '0.875rem',
                                marginTop: isSectionTitle && subIdx > 0 ? '0.6rem' : '0',
                                borderTop: isSectionTitle && subIdx > 0 ? '1px solid #e5e7eb' : 'none',
                                cursor: isSectionTitle ? 'default' : 'pointer'
                              }}
                              onMouseEnter={(e) => !isSectionTitle && (e.currentTarget.style.color = '#7024BB')}
                              onMouseLeave={(e) => !isSectionTitle && (e.currentTarget.style.color = '#6b7280')}
                            >
                              {subitem}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : idx === 1 ? (
                  // Menú para Profesores en columnas
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    {section.items.map((item, itemIdx) => (
                      <div key={itemIdx}>
                        {item.subitems && item.subitems.map((subitem, subIdx) => (
                          <div
                            key={subIdx}
                            className="transition-colors cursor-pointer"
                            style={{ 
                              padding: '0.4rem 0', 
                              color: '#4b5563',
                              fontSize: '0.875rem',
                              lineHeight: '1.4'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#7024BB'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#4b5563'}
                          >
                            {subitem}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 p-2">Contenido próximamente</p>
                )}
              </div>
            )}
          </div>
        ))}
        </div>

        {/* Separador visual - oculto en móvil */}
        <div className="hidden lg:block h-6 xl:h-7 w-px bg-gray-300"></div>

        {/* Sección de usuario/login */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 md:w-10 md:h-10 xl:w-11 xl:h-11 bg-[#7024BB] rounded-full flex items-center justify-center text-white font-semibold text-lg xl:text-xl hover:bg-[#5f1da0] transition-colors"
            >
              {getInitial(user)}
            </button>            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slideDown">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{user.name || 'Usuario'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                </div>
                
                <Link 
                  to="/perfil" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#7024BB] transition-colors"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Perfil
                </Link>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-3">
            <Link 
              to="/login" 
              className="px-3 md:px-5 py-2 md:py-2.5 text-sm md:text-base font-medium text-gray-700 hover:text-[#7024BB] transition-colors rounded-2xl hover:bg-gray-100"
            >
              <span className="hidden sm:inline">Iniciar sesión</span>
              <span className="sm:hidden">Entrar</span>
            </Link>
            <Link 
              to="/register" 
              className="px-4 md:px-6 py-2 md:py-2.5 text-sm md:text-base font-semibold bg-gradient-to-r from-[#7024BB] to-[#8e44e5] text-white rounded-2xl hover:from-[#5f1da0] hover:to-[#7c3ad4] active:from-[#4e1685] active:to-[#6a30c0] transition-all hover:scale-105 active:scale-95"
            >
              <span className="hidden sm:inline">Registrarse</span>
              <span className="sm:hidden">Registro</span>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;