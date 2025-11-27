import { useState, useMemo, useEffect } from 'react';
import Icon from '../components/Icon';

function TutoriasProfesor({ menu, activeSubsection, user }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};
  const tab = item.id || activeSubsection || 'default';
  // contenidos de ejemplo por pestaña (se actualiza historial con 5 datetimes)
  const contenidos = {
    'profesores': [
      { id: 1, alumno: 'María Pérez', hora: '10:00', estado: 'Pendiente' },
      { id: 2, alumno: 'Juan García', hora: '11:30', estado: 'Confirmada' },
    ],  
    'mis-tutorias': [
      { id: 1, alumno: 'Ana López', asunto: 'Consulta TFG', fecha: '2025-11-27' },
      { id: 2, alumno: 'Luis Ruiz', asunto: 'Revisión parcial', fecha: '2025-11-28' },
    ],
    // placeholder: historial será sustituido por dbHistorial si está disponible
    historial: [
      { id: 1, alumno: 'María Pérez', datetime: '2025-11-10T09:30:00' },
      { id: 2, alumno: 'Juan García', datetime: '2025-11-11T14:00:00' },
      { id: 3, alumno: 'Ana López', datetime: '2025-11-12T11:00:00' },
      { id: 4, alumno: 'Luis Ruiz', datetime: '2025-11-13T16:30:00' },
      { id: 5, alumno: 'Carla Martín', datetime: '2025-11-14T08:00:00' },
    ],
    reservar: [
      { id: 1, alumno: 'Carla Martín', motivo: 'Duda examen', fecha: '2025-11-29' },
      { id: 2, alumno: 'Pedro Soto', motivo: 'Proyecto', fecha: '2025-12-01' },
    ],
  };

  const sesiones = contenidos[tab];

  // --- Nuevo: estado y helpers para calendario semanal ---
  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // convierte domingo(0) -> 6, lunes -> 0
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  // reemplazamos la generación de daysOfWeek para 5 días (lunes-viernes)
  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  // estado para datos traídos desde la base de datos (historial)
  const [dbHistorial, setDbHistorial] = useState(null);
  const [, setHistorialError] = useState(null);
  // estado para modal de detalles de sesión
  const [selectedSession, setSelectedSession] = useState(null);
  // emails resueltos para mostrar en el modal (usamos solo el setter para evitar warning si no se leen directamente)
  const [, setProfEmail] = useState(null);
  const [, setStudentEmail] = useState(null);
  
  // helper para calcular fin de semana (end)
  const endOfWeek = (start) => {
    const d = new Date(start);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  // fetch del historial desde la API cuando la pestaña sea 'historial' o cambie la semana
  useEffect(() => {
    if (tab !== 'historial') return;
    let aborted = false;
    const controller = new AbortController();

    const fetchHistorial = async () => {
      try {
        setHistorialError(null);
        // enviar rango para optimizar consulta en backend
        const startISO = weekStart.toISOString();
        const endISO = endOfWeek(weekStart).toISOString();
        const res = await fetchApi(`/api/tutorias?type=historial&start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (aborted) return;
        // esperar que data sea array de { id, alumno, datetime, ... }
        setDbHistorial(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error cargando historial:', err);
        setHistorialError(err.message || 'Error');
        setDbHistorial([]); // fallback vacío
      }
    };

    fetchHistorial();
    return () => {
      aborted = true;
      controller.abort();
    };
  }, [tab, weekStart /* weekStart viene de estado definido más arriba */]);

  // usar datos de la DB si los tenemos, sino los ejemplos constantes
  const effectiveHistorial = dbHistorial !== null ? dbHistorial : contenidos.historial;

  const parsedHistorial = useMemo(() => {
    const list = effectiveHistorial || [];
    return list
      .map((s) => {
        // soportar formato de la BD: fechaInicio / fechaFin (ISO)
        const start = s.fechaInicio ? new Date(s.fechaInicio) : s.datetime ? new Date(s.datetime) : null;
        const end = s.fechaFin ? new Date(s.fechaFin) : null;
        // título y persona (intenta usar campos descriptivos si vienen poblados)
        const titulo = s.tema || s.title || s.descripcion || s.alumno || (s.estudiante && String(s.estudiante));
        const lugar = s.lugar || s.location || '';
        return {
          ...s,
          startDate: start,
          endDate: end,
          date: start || new Date(),
          title: titulo,
          place: lugar,
        };
      })
      // filtrar entradas sin fecha de inicio válida
      .filter((s) => s.startDate);
  }, [effectiveHistorial]);

  const sessionsByDay = useMemo(() => {
    const map = {};
    daysOfWeek.forEach((d) => {
      const key = d.toDateString();
      map[key] = [];
    });
    parsedHistorial.forEach((s) => {
      const key = s.date.toDateString();
      if (map[key]) map[key].push(s);
    });
    // ordenar por hora dentro de cada día
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.date - b.date);
    });
    return map;
  }, [daysOfWeek, parsedHistorial]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d));
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d));
  };

  const openSession = (s) => setSelectedSession(s);
  const closeSession = () => setSelectedSession(null);

  // helper para mostrar nombre/usuario/email si el campo viene poblado como objeto
  const personLabel = (p) => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    // p puede ser un objeto con distintos campos según el back
    return p.username || p.email || p.name || p.fullName || p.displayName || String(p._id || '') ;
  };
 
  // Cuando se abre una sesión, resolver emails para profesor y estudiante desde la API
  useEffect(() => {
    if (!selectedSession) {
      setProfEmail(null);
      setStudentEmail(null);
      return;
    }
    let aborted = false;
    const controller = new AbortController();

    const fetchEmail = async (idOrObj) => {
      if (!idOrObj) return null;
      const id = typeof idOrObj === 'string' ? idOrObj : (idOrObj._id || idOrObj.id || null);
      if (!id) return null;
      try {
        const res = await fetchApi(`/api/users/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (!res.ok) return null;
        const data = await res.json();
        return data.email || data.username || data.name || null;
      } catch (err) {
        if (err.name === 'AbortError') return null;
        return null;
      }
    };

    (async () => {
      const prof = await fetchEmail(selectedSession.profesor);
      const stud = await fetchEmail(selectedSession.estudiante);
      if (aborted) return;
      setProfEmail(prof || personLabel(selectedSession.profesor));
      setStudentEmail(stud || personLabel(selectedSession.estudiante));
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [selectedSession]);
  
  // --- Nuevas constantes para layout del calendario ---
  const dayStartHour = 8;
  const dayEndHour = 18;
  const hourHeight = 56; // px por hora
  const totalHours = dayEndHour - dayStartHour;
  const headerHeight = 40; // altura del título del día (estático)
  const timelineHeight = totalHours * hourHeight; // altura del área scrollable

  // --- reservas locales para la vista "reservar" ---
  const [localReservas, setLocalReservas] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newReserva, setNewReserva] = useState({
    asignatura: '',
    modalidad: 'presencial',
    lugar: '',
    diaSemana: 'lunes',
    horaInicio: '09:00',
    horaFin: '10:00',
    activo: true,
    alumno: '',
  });

  const reservasStorageKey = () => 'local_reservas';

  // API base (ajustable via env o localStorage). Por defecto http://localhost:4000 (backend)
  const API_BASE = (
    (typeof window !== 'undefined' && (window.__API_BASE__ || window.localStorage.getItem('API_BASE'))) ||
    (typeof process !== 'undefined' && (process.env && (process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE))) ||
    'http://localhost:4000'
  );
  const fetchApi = (path, opts = {}) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    // no 'credentials' by default to avoid CORS preflight cancellations when backend
    // doesn't accept cookies. Add default JSON header, merged with any opts.headers.
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    return fetch(`${API_BASE}${p}`, { ...opts, headers });
  };

  // helper para obtener id de usuario actual (ajusta si tu auth difiere)
  const getCurrentUserId = () => {
    // Preferir user pasado por props (user._id | user.id), fallback a localStorage
    if (user && (user._id || user.id)) return user._id || user.id;
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('userId') || null;
  };
  
  // cargar horarios desde /api/horarios?profesorId=... ; fallback a localStorage
  const loadUserSchedules = async () => {
    const uid = getCurrentUserId();
    if (!uid) {
      try {
        const raw = localStorage.getItem(reservasStorageKey());
        setLocalReservas(raw ? JSON.parse(raw) : []);
      } catch {
        setLocalReservas([]);
      }
      return;
    }
    try {
      const res = await fetchApi(`/api/horarios/${encodeURIComponent(uid)}`);
      if (!res.ok) throw new Error('No horarios');
      const data = await res.json();
      // data expected array of horarios
      setLocalReservas(Array.isArray(data) ? data : []);
      localStorage.setItem(reservasStorageKey(), JSON.stringify(Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('loadUserSchedules error', err);
      try {
        const raw = localStorage.getItem(reservasStorageKey());
        setLocalReservas(raw ? JSON.parse(raw) : []);
      } catch {
        setLocalReservas([]);
      }
    }
  };

  // cargar cuando montamos y cada vez que entramos en la pestaña reservar
  useEffect(() => {
    if (tab === 'reservar') loadUserSchedules();
  }, [tab]);

  // crear horario en backend (/api/horarios) o guardar local si no hay usuario
  const createHorario = async (horario) => {
    const uid = getCurrentUserId();
    if (!uid) {
      const id = `local_${Date.now()}`;
      const toSave = { ...horario, _id: id };
      const next = [toSave, ...localReservas];
      localStorage.setItem(reservasStorageKey(), JSON.stringify(next));
      setLocalReservas(next);
      return;
    }
    try {
      const payload = { ...horario, profesor: uid };
      const res = await fetchApi('/api/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error creando horario');
      // recargar desde servidor para evitar inconsistencias
      await loadUserSchedules();
    } catch (err) {
      console.error('createHorario error, guardando local', err);
      const id = `local_${Date.now()}`;
      const toSave = { ...horario, _id: id };
      const next = [toSave, ...localReservas];
      localStorage.setItem(reservasStorageKey(), JSON.stringify(next));
      setLocalReservas(next);
    }
  };
  
  // eliminar horario: si viene del servidor (id no empieza por 'local_') llamar DELETE /api/horarios/:id
  const deleteHorario = async (id) => {
    if (!id) return;
    if (!confirm('Borrar horario?')) return;
    if (!id.startsWith('local_')) {
      try {
        const res = await fetchApi(`/api/horarios/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Error borrando');
        // recargar desde servidor
        await loadUserSchedules();
        return;
      } catch (err) {
        console.error('deleteHorario error', err);
        alert('No se pudo borrar en servidor. Se eliminará localmente.');
      }
    }
    // fallback/local delete
    const next = localReservas.filter((r) => r._id !== id);
    setLocalReservas(next);
    localStorage.setItem(reservasStorageKey(), JSON.stringify(next));
  };

  const openCreateModal = () => {
    setNewReserva({
      asignatura: '',
      modalidad: 'presencial',
      lugar: '',
      diaSemana: 'lunes',
      horaInicio: '09:00',
      horaFin: '10:00',
      activo: true,
      alumno: localStorage.getItem('userName') || '',
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
  };

  const saveNewReserva = async () => {
    // validación básica
    if (!newReserva.asignatura || !newReserva.diaSemana || !newReserva.horaInicio || !newReserva.horaFin) {
      alert('Rellena asignatura, día y horas.');
      return;
    }
    const payload = {
      asignatura: newReserva.asignatura,
      modalidad: newReserva.modalidad,
      lugar: newReserva.lugar,
      diaSemana: newReserva.diaSemana,
      horaInicio: newReserva.horaInicio,
      horaFin: newReserva.horaFin,
      activo: newReserva.activo ?? true,
      meta: newReserva.meta || null,
    };
    await createHorario(payload);
    setShowCreateModal(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Icon name={item.icon || 'user-tie'} className="w-10 h-10 text-violet-600" />
            <h2 className="text-lg font-bold text-gray-900">{item.label || 'Zona Profesor'}</h2>
          </div>

          {/* Controles de semana (solo en historial) */}
          {tab === 'historial' ? (
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">«</button>
              <div className="text-sm text-gray-600">
                {daysOfWeek && daysOfWeek[0] ? daysOfWeek[0].toLocaleDateString() : ''} - {daysOfWeek && daysOfWeek[Math.min(4, daysOfWeek.length - 1)] ? daysOfWeek[Math.min(4, daysOfWeek.length - 1)].toLocaleDateString() : ''}
              </div>
              <button onClick={nextWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">»</button>
            </div>
          ) : null}

          {/* Botón "Nuevo horario" en el header solo para la pestaña reservar */}
          {tab === 'reservar' && (
            <div className="ml-4">
              <button
                onClick={openCreateModal}
                className="px-3 py-1 bg-violet-600 text-white rounded"
                aria-label="Nuevo horario"
              >
                Nuevo horario
              </button>
            </div>
          )}
        </div>

        {/* Gestión de tutorías */}
        {tab === 'profesores' && sesiones && (
          <>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.alumno}</div>
                    <div className="text-xs text-gray-500">{s.hora} · {s.estado}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-green-500 text-white rounded">Confirmar</button>
                    <button className="px-3 py-1 bg-red-500 text-white rounded">Cancelar</button>
                    <button className="px-3 py-1 bg-yellow-400 text-white rounded">Reprogramar</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Mis tutorías */}
        {tab === 'mis-tutorias' && sesiones && (
          <>
            <div className="space-y-3">
              {sesiones.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.alumno}</div>
                    <div className="text-xs text-gray-500">{s.asunto} · {s.fecha}</div>
                  </div>
                  <div className="text-xs text-gray-600">Ver detalles</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Historial: calendario semanal con días estáticos y timeline scrollable */}
        {tab === 'historial' && (
          <>
            <div className="mt-4">
              <div className="border rounded overflow-hidden shadow-sm">
                {/* HEADER ESTÁTICO: esquina vacía + títulos de los días */}
                <div className="flex">
                  {/* esquina izquierda (para alineación con columna de horas) */}
                  <div className="w-20 border-r border-violet-600 bg-violet-700" style={{ height: headerHeight }} />
                  {/* títulos de los días (estáticos) */}
                  <div className="flex-1 grid grid-cols-5">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day.toDateString()}
                        style={{ height: headerHeight }}
                        className="flex items-center justify-center text-sm font-semibold text-white bg-violet-700 border-b border-violet-600"
                      >
                        <div className="truncate">{day.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()} {day.getDate()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TIMELINE SCROLLABLE: horas + columnas de días dentro de un contenedor con overflow-y */}
                <div style={{ height: timelineHeight }} className="flex overflow-y-auto">
                  {/* columna de horas (se desplaza con el scroll) */}
                  <div className="w-20 bg-violet-700 border-r border-violet-600">
                    {Array.from({ length: totalHours }).map((_, idx) => {
                      const h = dayStartHour + idx;
                      return (
                        <div
                          key={h}
                          style={{ height: hourHeight }}
                          className="text-xs text-right flex items-center justify-end pr-3 border-b border-violet-600 text-white"
                        >
                          {`${String(h).padStart(2, '0')}:00`}
                        </div>
                      );
                    })}
                  </div>

                  {/* columnas de días (5) dentro del área scrollable */}
                  <div className="flex-1 grid grid-cols-5" style={{ minWidth: 0 }}>
                    {daysOfWeek.map((day) => {
                      const key = day.toDateString();
                      const items = sessionsByDay[key] || [];
                        return (
                        <div key={key} className="relative border-l border-violet-600" style={{ height: timelineHeight }}>
                          {/* líneas por hora (fondo) */}
                          {Array.from({ length: totalHours }).map((_, i) => (
                            <div key={i} style={{ height: hourHeight }} className="border-b border-dashed border-violet-600/30"></div>
                          ))}

                          {/* bloques de sesiones posicionados por hora */}
                          {items.map((s) => {
                            const start = s.startDate || s.date;
                            const end = s.endDate || (s.startDate ? new Date(s.startDate.getTime() + 30 * 60000) : null);
                            const minutesFromStart = (start.getHours() + start.getMinutes() / 60 - dayStartHour) * hourHeight;
                            const durationHours = end ? Math.max((end - start) / 3600000, 0.25) : 0.5;
                            const blockHeight = Math.max(40, durationHours * hourHeight);
                            const modality = s.modalidad || s.modality || '';
                            return (
                              <div
                                key={s._id || s.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => openSession(s)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openSession(s); }}
                                className="absolute left-3 right-3 rounded-lg shadow-lg cursor-pointer"
                                style={{
                                  top: `${Math.max(0, minutesFromStart)}px`,
                                  height: `${blockHeight}px`,
                                  overflow: 'hidden',
                                }}
                                title={`${s.title || 'Tutoría'}${modality ? ' — ' + modality : ''}`}
                              >
                                <div className="h-full flex">
                                  <div className="w-1 bg-white/30 rounded-l-md" />
                                  <div className="flex-1 bg-gradient-to-r from-violet-800 to-violet-600 text-white p-2 rounded-r-lg">
                                    {/* título */}
                                    <div className="text-sm font-semibold leading-tight truncate">{s.title || 'Tutoría'}</div>
                                    {/* modalidad */}
                                    <div className="text-xs opacity-90 mt-1 truncate">{modality}</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {/* Modal / panel con información completa */}
                          {selectedSession && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                              {/* overlay más claro */}
                              <div className="absolute inset-0 bg-black/20" onClick={closeSession} />
                              {/* modal más pequeño y con altura limitada */}
                              <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl overflow-auto max-h-[80vh]">
                                <div className="flex items-start justify-between p-4 border-b">
                                  <div>
                                    <h3 className="text-lg font-semibold">{selectedSession.title || selectedSession.tema || 'Tutoría'}</h3>
                                    <p className="text-sm text-gray-500">{selectedSession.place || selectedSession.lugar || ''}</p>
                                  </div>
                                  <button onClick={closeSession} className="text-gray-500 hover:text-gray-700 ml-4">Cerrar ✕</button>
                                </div>
                                <div className="p-4 space-y-3">
                                  <div className="text-sm text-gray-700">
                                    <strong>Hora:</strong>{' '}
                                    {(selectedSession.startDate || selectedSession.date) ? (
                                      <>
                                        {(new Date(selectedSession.startDate || selectedSession.date)).toLocaleString()} {selectedSession.endDate ? ` - ${(new Date(selectedSession.endDate)).toLocaleString()}` : ''}
                                      </>
                                    ) : '—'}
                                  </div>
                                  {selectedSession.descripcion && (
                                    <div>
                                      <div className="text-xs text-gray-500">Descripción</div>
                                      <div className="text-sm">{selectedSession.descripcion}</div>
                                    </div>
                                  )}
                                  {selectedSession.tema && (
                                    <div>
                                      <div className="text-xs text-gray-500">Tema</div>
                                      <div className="text-sm">{selectedSession.tema}</div>
                                    </div>
                                  )}
                                  {selectedSession.modalidad && (
                                    <div className="text-sm"><strong>Modalidad:</strong> {selectedSession.modalidad}</div>
                                  )}
                                  {selectedSession.lugar && (
                                    <div className="text-sm"><strong>Lugar:</strong> {selectedSession.lugar}</div>
                                  )}
                                  {selectedSession.estado && (
                                    <div className="text-sm"><strong>Estado:</strong> {selectedSession.estado}</div>
                                  )}
                                  {/* mostrar email resuelto para profesor/estudiante */}
                                  {selectedSession.profesor && (
                                    <div className="text-sm"><strong>Profesor:</strong> {selectedSession.profesor}</div>
                                  )}
                                  {selectedSession.estudiante && (
                                    <div className="text-sm"><strong>Estudiante:</strong> {selectedSession.estudiante}</div>
                                  )}
                                  <div className="text-right">
                                    <button onClick={closeSession} className="px-3 py-1 bg-violet-600 text-white rounded">Cerrar</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
          </>
        )}

        {/* Solicitudes de tutoría */}
        {tab === 'reservar' && sesiones && (
          <>
            <div className="mb-3">
              <h3 className="text-lg font-semibold">Solicitudes / Crear horario</h3>
            </div>

            <div className="space-y-3">
              {localReservas.map((s) => (
                <div key={s._id || s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.asignatura || 'Sin asignatura'}</div>
                    <div className="text-xs text-gray-500">
                      {s.diaSemana ? `${s.diaSemana} ` : ''}{s.horaInicio ? `${s.horaInicio}` : ''}{s.horaFin ? ` - ${s.horaFin}` : ''} {s.modalidad ? `· ${s.modalidad}` : ''}
                    </div>
                    {s.lugar && <div className="text-xs text-gray-400">{s.lugar}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => deleteHorario(s._id || s.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal de creación (local) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20" onClick={closeCreateModal} />
            <div className="relative z-10 w-full max-w-2xl mx-4 bg-white rounded-lg shadow-xl overflow-auto max-h-[85vh]">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Crear horario de tutoría</h3>
                <button onClick={closeCreateModal} className="text-gray-500 hover:text-gray-700 ml-4">Cerrar ✕</button>
              </div>
              <div className="p-4">
                {/* Formulario en dos columnas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Asignatura</label>
                    <input
                      value={newReserva.asignatura}
                      onChange={(e) => setNewReserva({ ...newReserva, asignatura: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Día de la semana</label>
                    <select
                      value={newReserva.diaSemana}
                      onChange={(e) => setNewReserva({ ...newReserva, diaSemana: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="lunes">lunes</option>
                      <option value="martes">martes</option>
                      <option value="miercoles">miercoles</option>
                      <option value="jueves">jueves</option>
                      <option value="viernes">viernes</option>
                      <option value="sabado">sabado</option>
                      <option value="domingo">domingo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Modalidad</label>
                    <select
                      value={newReserva.modalidad}
                      onChange={(e) => setNewReserva({ ...newReserva, modalidad: e.target.value })}
                      className="w-full p-2 border rounded"
                    >
                      <option value="presencial">presencial</option>
                      <option value="online">online</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Lugar</label>
                    <input
                      value={newReserva.lugar}
                      onChange={(e) => setNewReserva({ ...newReserva, lugar: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Hora inicio</label>
                    <input
                      type="time"
                      value={newReserva.horaInicio || '09:00'}
                      onChange={(e) => setNewReserva({ ...newReserva, horaInicio: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Hora fin</label>
                    <input
                      type="time"
                      value={newReserva.horaFin || '10:00'}
                      onChange={(e) => setNewReserva({ ...newReserva, horaFin: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                 </div>
                 <div className="flex justify-end gap-2 mt-4">
                   <button onClick={closeCreateModal} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                   <button onClick={saveNewReserva} className="px-3 py-1 bg-violet-600 text-white rounded">Guardar</button>
                 </div>
               </div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
}

export default TutoriasProfesor;

