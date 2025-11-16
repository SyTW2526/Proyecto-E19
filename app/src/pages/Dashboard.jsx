import React from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ user }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenedor principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de bienvenida */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user?.name || user?.email?.split('@')[0] || 'Usuario'}!
          </h1>
          <p className="text-gray-600">
            Esta es tu plataforma de gestión de tutorías
          </p>
        </div>

        {/* Grid de secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder para futuras funcionalidades */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">📅</div>
                <p className="text-gray-500 font-medium">Mis Tutorías</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-gray-500 font-medium">Foros</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-500 font-medium">Mi Progreso</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-gray-500 font-medium">Profesores</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">📍</div>
                <p className="text-gray-500 font-medium">Ubicaciones</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-center h-40">
              <div className="text-center">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-gray-500 font-medium">Notificaciones</p>
                <p className="text-sm text-gray-400 mt-1">Próximamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-8 bg-[#5C068C] text-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">🚀 Plataforma en Desarrollo</h2>
          <p className="text-purple-100">
            Estamos trabajando para ofrecerte la mejor experiencia en la gestión de tus tutorías.
            Pronto podrás acceder a todas estas funcionalidades.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
