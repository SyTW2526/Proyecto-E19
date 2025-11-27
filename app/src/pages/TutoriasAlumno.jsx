import React, { useState, useEffect } from 'react';
import Icon from '../components/Icon';

function TutoriasAlumno({ menu, activeSubsection, user }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};

  // API base (ajustable). Por defecto apunta al backend.
  const API_BASE =
    (typeof window !== 'undefined' && (window.__API_BASE__ || window.localStorage.getItem('API_BASE'))) ||
    (typeof process !== 'undefined' && (process.env && (process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE))) ||
    'http://localhost:5173';

  const fetchApi = (path, opts = {}) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    return fetch(`${API_BASE}${p}`, { ...opts, headers });
  };

  const [profesores, setProfesores] = useState([]); // [{ id, name, horarios: [] }, ...]

  useEffect(() => {
    // aceptar variaciones de mayúsculas / espacios
    if (String(activeSubsection || '').toLowerCase().trim() !== 'reservar') return;
    console.log('TutoriasAlumno: activeSubsection=', activeSubsection);

    let cancelled = false;

    const load = async () => {
      try {
        // 1) obtener todos los horarios
        const res = await fetchApi('/api/horarios');
        if (!res.ok) throw new Error('No se pudieron cargar horarios');
        const horarios = await res.json();

        // DEBUG: ver qué trae el backend
        console.log('TutoriasAlumno: horarios recibidos', horarios);

        // filtrar solo activos y agrupar por profesor id
        const activos = Array.isArray(horarios) ? horarios.filter((x) => x && x.activo) : [];
        console.log('TutoriasAlumno: horarios activos', activos);

        const map = new Map();
        activos.forEach((h) => {
           // Normalizar el identificador del profesor en varios formatos:
           // - h.profesor puede ser string, ObjectId o un objeto poblado { _id, name }
           // - también consideramos h.profesorId como fallback
           let profId = 'sin-profesor';
           if (h.profesor) {
             if (typeof h.profesor === 'object' && (h.profesor._id || h.profesor.id)) {
               // objeto poblado con _id/id
               profId = String(h.profesor._id || h.profesor.id);
             } else {
               // puede ser string u ObjectId convertible a string
               profId = String(h.profesor);
             }
           } else if (h.profesorId) {
             profId = String(h.profesorId);
           }
           if (!map.has(profId)) map.set(profId, { id: profId, horarios: [] });
           map.get(profId).horarios.push(h);
         });

        console.log('TutoriasAlumno: agrupamiento por profesor (sin nombres)', Array.from(map.entries()).map(([k, v]) => ({ id: k, count: v.horarios.length })));
         // 3) para cada profesor obtener nombre vía /api/users/:id
         const entries = Array.from(map.values());
         const profsWithNames = await Promise.all(
           entries.map(async (p) => {
             if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
             try {
               const r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
               if (!r.ok) throw new Error('no user');
               const u = await r.json();
               const name = u.name || u.username || u.fullName || (u.email ? u.email.split('@')[0] : 'Profesor');
               return { id: p.id, name, horarios: p.horarios };
             } catch {
               return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
             }
           })
         );
+        console.log('TutoriasAlumno: profesores con nombres', profsWithNames);
 
         if (!cancelled) setProfesores(profsWithNames);
       } catch (err) {
         console.error('Error cargando profesores con horarios', err);
         if (!cancelled) setProfesores([]);
       }
     };
 
     load();
     return () => { cancelled = true; };
   }, [activeSubsection]);

  const onReservar = (prof) => {
    // Placeholder mínimo: abrir modal o ir a formulario de reserva
    alert(`Reservar con ${prof.name}`);
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="text-center w-full">
          

          {/* Si estamos en la pestaña 'reservar' mostramos los profesores con horarios */}
          {activeSubsection === 'reservar' ? (
            <div className="mt-6 w-full">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Profesores con horarios</h3>
              {profesores.length === 0 ? (
                <div className="text-sm text-gray-500">No hay profesores disponibles en este momento.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profesores.map((p) => (
                    <div key={p.id} className="border rounded p-4 flex flex-col justify-between">
                      <div>
                        <div className="text-lg font-semibold">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {p.horarios.length} {p.horarios.length === 1 ? 'franja' : 'franjas'}
                        </div>
                        <ul className="mt-3 text-sm text-gray-600 space-y-1">
                          {p.horarios.slice(0, 3).map((h) => (
                            <li key={h._id || `${p.id}-${h.diaSemana}-${h.horaInicio}`}>
                              {h.asignatura ? `${h.asignatura} · ` : ''}{h.diaSemana} {h.horaInicio} - {h.horaFin} {h.modalidad ? `· ${h.modalidad}` : ''}
                            </li>
                          ))}
                          {p.horarios.length > 3 && <li className="text-xs text-gray-400">...y más</li>}
                        </ul>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={() => onReservar(p)}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md"
                        >
                          Reservar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Reservar tutoría</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutoriasAlumno;
