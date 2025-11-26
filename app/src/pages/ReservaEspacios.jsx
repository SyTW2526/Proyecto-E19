import React from 'react';
import Icon from '../components/Icon';

function ReservaEspacios({ menu, activeSubsection }) {
  const item = menu.find((m) => m.id === activeSubsection) || {};

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="text-center">
          <div className="mb-4">
            <Icon name={item.icon || 'pin'} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto text-gray-400" />
          </div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
            {item.label || 'Reserva de espacios'}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-md px-4">
            Parte de Eduardo Reserva espacios de estudio y salas de forma sencilla.
          </p>
          <div className="mt-6 text-xs text-gray-400">
            <p>Subsección: <span className="font-semibold">{activeSubsection}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReservaEspacios;
