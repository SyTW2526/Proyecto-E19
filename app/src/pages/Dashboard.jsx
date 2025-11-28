import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import Icon from '../components/Icon';
import DashboardMain from './DashboardMain';
import TutoriasPage from './TutoriasPage';
import ReservaEspacios from './ReservaEspacios';
import Calendario from './Calendario';

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
              {/* Contenido por sección: cada sección tiene su propio componente */}
              {currentSection === 'dashboard' && (
                <DashboardMain menu={menu} activeSubsection={activeSubsection} />
              )}
              {currentSection === 'tutorias' && (
                <TutoriasPage menu={menu} activeSubsection={activeSubsection} user={user} />
              )}
              {currentSection === 'espacios' && (
                <ReservaEspacios menu={menu} activeSubsection={activeSubsection} />
              )}
              {currentSection === 'calendario' && (
                <Calendario menu={menu} activeSubsection={activeSubsection} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
