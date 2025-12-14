import React, { createContext, useContext, useState } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation debe usarse dentro de NavigationProvider');
  }
  return context;
};

// Definición de menús contextuales para cada sección
const sidebarMenus = {
  dashboard: [
    { id: 'resumen', label: 'Resumen general', icon: 'book' },
    { id: 'actividad', label: 'Actividad reciente', icon: 'calendar' },
    { id: 'proximos', label: 'Próximos eventos', icon: 'bell' },
  ],
  tutorias: [
    { id: 'reservar', label: 'Reservar tutoría', icon: 'calendar' },
    { id: 'mis-tutorias', label: 'Mis tutorías', icon: 'book' },
    { id: 'profesores', label: 'Solicitudes de reserva', icon: 'users' },
  ],
  espacios: [
    { id: 'buscar', label: 'Buscar espacio', icon: 'pin' },
    { id: 'mis-reservas', label: 'Mis reservas', icon: 'calendar' },
    // { id: 'favoritos', label: 'Espacios favoritos', icon: 'pin' },
    { id: 'historial-reservas', label: 'Historial', icon: 'book' },
  ],
  calendario: [
    { id: 'mensual', label: 'Vista mensual', icon: 'calendar' },
    // { id: 'semanal', label: 'Vista semanal', icon: 'calendar' },
    // { id: 'diaria', label: 'Vista diaria', icon: 'calendar' },
    // { id: 'mis-eventos', label: 'Mis eventos', icon: 'book' },
  ],
};

// Accesos rápidos que aparecen en todas las secciones
const quickAccess = [
  { id: 'calendario-rapido', label: 'Ver calendario', icon: 'calendar', section: 'calendario' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'bell', section: 'dashboard' },
];

export const NavigationProvider = ({ children }) => {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [activeSubsection, setActiveSubsection] = useState('resumen');

  const getCurrentMenu = () => sidebarMenus[currentSection] || [];
  const getQuickAccess = () => quickAccess;

  const navigateToSection = (section, subsection = null) => {
    setCurrentSection(section);
    // Si se proporciona una subsección específica, usarla
    if (subsection) {
      setActiveSubsection(subsection);
    } else {
      // Al cambiar de sección, ir a la primera subsección
      const menu = sidebarMenus[section];
      if (menu && menu.length > 0) {
        setActiveSubsection(menu[0].id);
      }
    }
  };

  const navigateToSubsection = (subsection) => {
    setActiveSubsection(subsection);
  };

  return (
    <NavigationContext.Provider
      value={{
        currentSection,
        activeSubsection,
        navigateToSection,
        navigateToSubsection,
        getCurrentMenu,
        getQuickAccess,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};
