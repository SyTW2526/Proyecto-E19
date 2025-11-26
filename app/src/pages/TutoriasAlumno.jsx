import React from 'react';
import Icon from '../components/Icon';

function TutoriasAlumno({ menu, activeSubsection }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="text-center">
          <div className="mb-4">
            <Icon name={item.icon || 'users'} className="w-12 h-12 text-blue-500 mx-auto" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Zona Alumno</h2>
          <p className="text-sm text-gray-600 max-w-md px-4">
            Reserva y gestiona tus tutorías aquí. Verás las opciones disponibles y podrás solicitar una cita.
          </p>
          <div className="mt-6">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Reservar tutoría</button>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            <p>Subsección: <span className="font-semibold">{activeSubsection}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutoriasAlumno;
