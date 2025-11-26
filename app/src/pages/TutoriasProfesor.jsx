import React from 'react';
import Icon from '../components/Icon';

function TutoriasProfesor({ menu, activeSubsection }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};

  // ejemplo de datos estáticos para comprobar contenido diferenciado
  const sesiones = [
    { id: 1, alumno: 'María Pérez', hora: '10:00' },
    { id: 2, alumno: 'Juan García', hora: '11:30' },
  ];

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="min-h-[300px]">
        <div className="flex items-center gap-4 mb-4">
          <Icon name={item.icon || 'user-tie'} className="w-10 h-10 text-green-600" />
          <h2 className="text-lg font-bold text-gray-900">Zona Profesor</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Panel de gestión de tutorías: confirma, cancela o reprograma sesiones con tus alumnos.
        </p>

        <div className="space-y-3">
          {sesiones.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <div className="font-semibold">{s.alumno}</div>
                <div className="text-xs text-gray-500">{s.hora}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-green-500 text-white rounded">Confirmar</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded">Cancelar</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-400">
          <p>Subsección: <span className="font-semibold">{activeSubsection}</span></p>
        </div>
      </div>
    </div>
  );
}

export default TutoriasProfesor;
