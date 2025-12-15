import React from 'react';

import { useNavigate } from 'react-router-dom';


const AboutUs = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#7024BB] to-[#8e44e5] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-6">
            Sobre Nosotros
          </h1>
          <p className="text-xl text-center text-purple-100 max-w-3xl mx-auto">
            Somos un equipo apasionado dedicado a mejorar la experiencia universitaria
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Nuestra Misión
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed text-center max-w-4xl mx-auto">
            ULL Calendar nace con el objetivo de centralizar y facilitar la gestión académica 
            de los estudiantes de la Universidad de La Laguna. Nuestra plataforma integra 
            funcionalidades esenciales como la gestión de tutorías, reserva de espacios, 
            calendario académico y recursos educativos en un solo lugar, haciendo la vida 
            universitaria más organizada y eficiente.
          </p>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Nuestro Equipo
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#7024BB] to-[#8e44e5] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                DH
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Diego Hernández</h3>
              <p className="text-[#7024BB] font-semibold mb-3">Desarrollador Full Stack</p>
              
            </div>

            {/* Team Member 2 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#7024BB] to-[#8e44e5] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                ER
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Eduardo Restrepo</h3>
              <p className="text-[#7024BB] font-semibold mb-3">Desarrollador Full Stack</p>
              
            </div>

            {/* Team Member 3 */}
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#7024BB] to-[#8e44e5] rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold">
                CM
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Jose Suarez</h3>
              <p className="text-[#7024BB] font-semibold mb-3">Desarrollador Full Stack</p>
              
            </div>

            
          </div>
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Nuestros Valores
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#7024BB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confiabilidad</h3>
              <p className="text-gray-600">
                Construimos software robusto y seguro en el que los estudiantes pueden confiar
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#7024BB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Innovación</h3>
              <p className="text-gray-600">
                Implementamos las últimas tecnologías para ofrecer la mejor experiencia
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#7024BB]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Comunidad</h3>
              <p className="text-gray-600">
                Escuchamos y respondemos a las necesidades de la comunidad universitaria
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-[#7024BB] to-[#8e44e5] rounded-2xl shadow-lg p-8 md:p-12 text-white text-center">
          
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 bg-white text-[#7024BB] px-8 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
