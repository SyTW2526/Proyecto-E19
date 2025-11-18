import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';

function Icon({ name, className = 'w-5 h-5' }) {
  const icons = {
    book: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    calendar: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    pin: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    users: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    bell: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    cog: (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const { currentSection, activeSubsection, navigateToSubsection, getCurrentMenu, getQuickAccess } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const menu = getCurrentMenu();
  const quickAccess = getQuickAccess();

  // Títulos de sección para el contenido principal
  const sectionTitles = {
    dashboard: 'Dashboard',
    tutorias: 'Tutorías',
    espacios: 'Reserva de espacios',
    calendario: 'Calendario',
  };

  const sectionDescriptions = {
    dashboard: 'Gestiona tu actividad académica desde aquí',
    tutorias: 'Reserva y gestiona tus tutorías con profesores',
    espacios: 'Reserva espacios de estudio y salas',
    calendario: 'Visualiza todos tus eventos y reservas',
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Overlay para cerrar sidebar en móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar fija a la izquierda - responsive */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white overflow-y-auto pt-16 z-30 transition-transform duration-300 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-3">
          {/* Título del menú */}
          <div className="px-3 mb-2">
            <p className="text-xs font-semibold text-gray-400 tracking-wider">
              {sectionTitles[currentSection].toUpperCase()}
            </p>
          </div>

          {/* Menú contextual según la sección */}
          <nav className="space-y-1">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  navigateToSubsection(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                  activeSubsection === item.id
                    ? 'bg-[#7024BB] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon name={item.icon} className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Accesos rápidos en la parte inferior */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 tracking-wider mb-3 px-3">ACCESOS RÁPIDOS</p>
            {quickAccess.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.section !== currentSection) {
                    navigateToSubsection(item.id);
                  }
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-2"
              >
                <Icon name={item.icon} className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Botón hamburguesa para móvil */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-20 left-4 z-40 lg:hidden bg-white p-2 rounded-lg shadow-lg"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Contenido principal - responsive */}
      <main className="lg:ml-64 fixed inset-0 pt-16 lg:pt-20 flex flex-col">
        <div className="flex-1 pl-3 sm:pl-4 lg:pl-6 overflow-hidden">
          <div className="h-full bg-gray-100 rounded-tl-3xl flex flex-col overflow-hidden">
            {/* Título fijo */}
            <div className="p-4 sm:p-6 lg:p-8 pb-3 lg:pb-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 lg:mb-2">
                {menu.find(m => m.id === activeSubsection)?.label || sectionTitles[currentSection]}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {sectionDescriptions[currentSection]}
              </p>
            </div>

            {/* Contenido con scroll interno */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              {/* Contenido placeholder */}
              <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
                <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
                  <div className="text-center">
                    <div className="mb-4">
                      <Icon name={menu.find(m => m.id === activeSubsection)?.icon || 'book'} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto text-gray-400" />
                    </div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                      {menu.find(m => m.id === activeSubsection)?.label || 'Sección en desarrollo'}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 max-w-md px-4">
                      Esta funcionalidad estará disponible próximamente. Estamos trabajando para ofrecerte la mejor experiencia.
                    </p>
                    <div className="mt-6 text-xs text-gray-400">
                      <p>Sección: <span className="font-semibold">{currentSection}</span></p>
                      <p>Subsección: <span className="font-semibold">{activeSubsection}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
