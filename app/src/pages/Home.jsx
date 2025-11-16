import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home({ setUser }) {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}>

      {/* Contenido principal */}
      <main className="py-8 md:py-12 px-4 md:px-8 max-w-7xl mx-auto">
        {/* Sección hero de bienvenida */}
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-[#6b21a8] text-3xl md:text-4xl lg:text-5xl mb-4 font-bold">
            Sistema de Gestión de Tutorías ULL
          </h1>
          <p className="text-gray-600 text-lg md:text-xl max-w-4xl mx-auto leading-relaxed px-4">
            Plataforma integral para la coordinación y gestión de tutorías académicas en la Universidad de La Laguna
          </p>
        </div>

        {/* Descripción de la aplicación */}
        <div className="bg-gray-50 p-6 md:p-8 rounded-xl mb-8 md:mb-12 border border-gray-200">
          <h2 className="text-gray-900 text-2xl md:text-3xl mb-4 md:mb-6 font-semibold">
            ¿Qué es el Sistema de Tutorías?
          </h2>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
            Esta aplicación web está diseñada para facilitar la comunicación y coordinación entre estudiantes y profesores
            en el ámbito de las tutorías académicas. Proporciona un espacio centralizado donde gestionar citas, compartir
            recursos y mantener un seguimiento del progreso académico.
          </p>
          <p className="text-gray-700 text-base md:text-lg leading-relaxed">
            Nuestro objetivo es optimizar el tiempo de profesores y estudiantes, eliminando la fricción en la organización
            de tutorías y fomentando un ambiente de aprendizaje más efectivo y accesible.
          </p>
        </div>

        {/* Funcionalidades principales */}
        <h2 className="text-gray-900 text-2xl md:text-3xl mb-6 md:mb-8 font-semibold text-center">
          Funcionalidades Principales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📅</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Gestión de Citas
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Reserva tutorías con tus profesores de forma sencilla. Visualiza la disponibilidad en tiempo real y recibe confirmaciones automáticas.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Foros de Discusión
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Participa en foros por asignatura donde estudiantes y profesores pueden compartir dudas, recursos y conocimientos.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Ubicaciones y Aulas
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Encuentra fácilmente dónde se realizan las tutorías con mapas interactivos del campus y direcciones precisas.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Directorio de Profesores
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Accede a información de contacto, horarios de tutoría y especialidades de todos los profesores del departamento.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Seguimiento Académico
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Lleva un registro de tus tutorías pasadas, temas tratados y objetivos planteados para un mejor seguimiento de tu progreso.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="text-gray-900 text-xl font-semibold mb-3">
              Notificaciones
            </h3>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              Recibe recordatorios de próximas tutorías, cambios de horario y mensajes importantes de tus profesores.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center py-8 md:py-10 px-6 md:px-8 bg-[#6b21a8] rounded-xl text-white">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3 md:mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-base md:text-lg mb-5 md:mb-6 opacity-90">
            Únete a cientos de estudiantes que ya están optimizando sus tutorías
          </p>
          <button 
            onClick={() => navigate('/login')}
            className="bg-white text-[#6b21a8] px-6 md:px-8 py-3 md:py-3.5 rounded-lg text-base md:text-lg font-semibold hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-lg"
          >
            Acceder a la plataforma
          </button>
        </div>
      </main>
    </div>
  );
}

export default Home;

