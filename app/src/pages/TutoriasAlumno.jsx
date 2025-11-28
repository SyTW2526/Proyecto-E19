import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../components/Icon';

function TutoriasAlumno({ menu, activeSubsection, user }) {
  const item = (menu || []).find((m) => m.id === activeSubsection) || {};

  // API base (ajustable). Por defecto apunta al backend.
  const API_BASE =
    (typeof window !== 'undefined' && (window.__API_BASE__ || window.localStorage.getItem('API_BASE'))) ||
    (typeof process !== 'undefined' && (process.env && (process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE))) ||
    'http://localhost:4000';
  const fetchApi = (path, opts = {}) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    return fetch(`${API_BASE}${p}`, { ...opts, headers });
  };

  const [profesores, setProfesores] = useState([]); // [{ id, name, horarios: [] }, ...]
  const [loading, setLoading] = useState(false);

  // Reserva drawer / form state
  const [showReserveDrawer, setShowReserveDrawer] = useState(false);
  const [reservedProfessor, setReservedProfessor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]); // { isoStart, isoEnd, label }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidadReserva, setModalidadReserva] = useState('presencial');
  const [lugarReserva, setLugarReserva] = useState('');
  const [saving, setSaving] = useState(false);

  // mapping day name -> JS getDay index
  const dayNameToIndex = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6
  };

  // compute 30min slots for a professor's HorarioTutoria entries over next N days
  const computeSlotsForProfessor = (prof, daysAhead = 14) => {
    if (!prof || !Array.isArray(prof.horarios)) return [];
    const now = new Date();
    const slots = [];
    for (let offset = 0; offset < daysAhead; offset++) {
      const date = new Date();
      date.setDate(now.getDate() + offset);
      prof.horarios.forEach((h) => {
        const dayIdx = dayNameToIndex[(h.diaSemana || '').toLowerCase()];
        if (dayIdx === undefined) return;
        if (date.getDay() !== dayIdx) return;
        const [sh, sm] = (h.horaInicio || '00:00').split(':').map(Number);
        const [eh, em] = (h.horaFin || '00:00').split(':').map(Number);
        if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return;
        const startBase = new Date(date); startBase.setHours(sh, sm, 0, 0);
        const endBase = new Date(date); endBase.setHours(eh, em, 0, 0);
        for (let t = new Date(startBase); t < endBase; t = new Date(t.getTime() + 30 * 60000)) {
          const slotStart = new Date(t);
          const slotEnd = new Date(t.getTime() + 30 * 60000);
          if (slotEnd <= now) continue; // skip past slots
          if (slotEnd > endBase) continue;
          slots.push({
            isoStart: slotStart.toISOString(),
            isoEnd: slotEnd.toISOString(),
            label: `${slotStart.toLocaleDateString()} ${String(slotStart.getHours()).padStart(2,'0')}:${String(slotStart.getMinutes()).padStart(2,'0')} - ${String(slotEnd.getHours()).padStart(2,'0')}:${String(slotEnd.getMinutes()).padStart(2,'0')}`
          });
        }
      });
    }
    slots.sort((a, b) => new Date(a.isoStart) - new Date(b.isoStart));
    return slots;
  };

  // load horarios and group by professor
  useEffect(() => {
    if (String(activeSubsection || '').toLowerCase().trim() !== 'reservar') return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // try primary endpoint then fallback
        let res = await fetchApi('/api/horarios');
        if (!res.ok) res = await fetchApi('/api/horarios/horarios');
        if (!res.ok) throw new Error('No se pudieron cargar horarios');
        const horarios = await res.json();
        const activos = Array.isArray(horarios) ? horarios.filter(x => x && x.activo) : [];

        const map = new Map();
        activos.forEach((h) => {
          let profId = 'sin-profesor';
          if (h.profesor) {
            if (typeof h.profesor === 'object' && (h.profesor._id || h.profesor.id)) profId = String(h.profesor._id || h.profesor.id);
            else profId = String(h.profesor);
          } else if (h.profesorId) {
            profId = String(h.profesorId);
          }
          if (!map.has(profId)) map.set(profId, { id: profId, horarios: [] });
          map.get(profId).horarios.push(h);
        });

        const entries = Array.from(map.values());
        const profsWithNames = await Promise.all(entries.map(async (p) => {
          if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          try {
            // prefer /api/usuarios
            let r = await fetchApi(`/api/usuarios/${encodeURIComponent(p.id)}`);
            if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
            if (!r.ok) throw new Error('no user');
            const u = await r.json();
            const name = u.name || u.username || u.fullName || (u.email ? u.email.split('@')[0] : 'Profesor');
            return { id: p.id, name, horarios: p.horarios };
          } catch {
            return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          }
        }));

        if (!cancelled) setProfesores(profsWithNames);
      } catch (err) {
        console.error('Error cargando profesores con horarios', err);
        if (!cancelled) setProfesores([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeSubsection]);

  // open reservation drawer for a professor
  const openReserve = (prof) => {
    setReservedProfessor(prof);
    const slots = computeSlotsForProfessor(prof, 14);
    setAvailableSlots(slots);
    setSelectedSlot(slots[0] || null);
    setTema('');
    setDescripcion('');
    setModalidadReserva('presencial');
    setLugarReserva('');
    setShowReserveDrawer(true);
  };

  const closeReserve = () => {
    setShowReserveDrawer(false);
    setReservedProfessor(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  // submit Tutoria to server (use /api/tutorias)
  const submitReserva = async () => {
    if (!reservedProfessor || !selectedSlot) {
      alert('Selecciona un hueco de 30 min.');
      return;
    }
    if (!user || !(user._id || user.id)) {
      alert('Usuario no identificado.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tema: tema || `Tutoria con ${reservedProfessor.name}`,
        descripcion: descripcion || '',
        profesor: reservedProfessor.id,
        estudiante: user._id || user.id,
        fechaInicio: selectedSlot.isoStart,
        fechaFin: selectedSlot.isoEnd,
        modalidad: modalidadReserva,
        lugar: lugarReserva || ''
      };
      const res = await fetchApi('/api/tutorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(()=>null);
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      // refresh list of profesores/hours
      // small delay to allow backend to be consistent
      await new Promise(r => setTimeout(r, 250));
      // reload by reusing the effect: trigger by temporarily toggling activeSubsection? simpler: call load logic directly
      // we'll call the same fetch used in effect:
      let reloadRes = await fetchApi('/api/horarios');
      if (!reloadRes.ok) reloadRes = await fetchApi('/api/horarios/horarios');
      if (reloadRes.ok) {
        const horarios = await reloadRes.json();
        const activos = Array.isArray(horarios) ? horarios.filter(x => x && x.activo) : [];
        const map = new Map();
        activos.forEach((h) => {
          let profId = 'sin-profesor';
          if (h.profesor) {
            if (typeof h.profesor === 'object' && (h.profesor._id || h.profesor.id)) profId = String(h.profesor._id || h.profesor.id);
            else profId = String(h.profesor);
          } else if (h.profesorId) profId = String(h.profesorId);
          if (!map.has(profId)) map.set(profId, { id: profId, horarios: [] });
          map.get(profId).horarios.push(h);
        });
        const entries = Array.from(map.values());
        const profsWithNames = await Promise.all(entries.map(async (p) => {
          if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          try {
            let r = await fetchApi(`/api/usuarios/${encodeURIComponent(p.id)}`);
            if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
            if (!r.ok) throw new Error('no user');
            const u = await r.json();
            const name = u.name || u.username || (u.email ? u.email.split('@')[0] : 'Profesor');
            return { id: p.id, name, horarios: p.horarios };
          } catch {
            return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios };
          }
        }));
        setProfesores(profsWithNames);
      }
      closeReserve();
      alert('Tutoria creada correctamente.');
    } catch (err) {
      console.error('Error creando tutoria', err);
      alert('No se pudo crear la tutoria: ' + (err.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  // replace simple alert with drawer opener
  const onReservar = (prof) => {
    openReserve(prof);
  };

  // -----------------------
  // Historial (calendario) para el alumno actual
  // -----------------------
  const startOfWeek = (date) => {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - day);
    d.setHours(0,0,0,0);
    return d;
  };
  const endOfWeek = (start) => {
    const d = new Date(start);
    d.setDate(d.getDate() + 6);
    d.setHours(23,59,59,999);
    return d;
  };

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const daysOfWeek = useMemo(() => {
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const personLabel = (p) => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return p.username || p.email || p.name || p.fullName || String(p._id || '');
  };

  // fetch historial para este estudiante en la semana actual
  useEffect(() => {
    if (!activeSubsection || String(activeSubsection).toLowerCase() !== 'historial') return;
    let cancelled = false;
    const load = async () => {
      setLoadingHistorial(true);
      try {
        const uid = user && (user._id || user.id);
        if (!uid) {
          setHistorial([]);
          setLoadingHistorial(false);
          return;
        }
        const startISO = weekStart.toISOString();
        const endISO = endOfWeek(weekStart).toISOString();
        let res = await fetchApi(`/api/tutorias?estudiante=${encodeURIComponent(uid)}&inicio=${encodeURIComponent(startISO)}&fin=${encodeURIComponent(endISO)}`);
        if (!res.ok) {
          // fallback a endpoint reservas por alumno si existe
          res = await fetchApi(`/api/horarios/reservas/alumno/${encodeURIComponent(uid)}`);
        }
        if (!res.ok) throw new Error('No se pudo cargar historial');
        const data = await res.json();
        if (!cancelled) setHistorial(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando historial alumno', err);
        if (!cancelled) setHistorial([]);
      } finally {
        if (!cancelled) setLoadingHistorial(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeSubsection, weekStart, user]);

  // normalizar historial a sesiones con startDate/endDate/title/place
  const parsedHistorial = useMemo(() => {
    return (historial || []).map((s) => {
      const start = s.fechaInicio ? new Date(s.fechaInicio) : s.datetime ? new Date(s.datetime) : null;
      const end = s.fechaFin ? new Date(s.fechaFin) : (s.fechaInicio ? new Date(new Date(s.fechaInicio).getTime() + 30*60000) : null);
      const titulo = s.tema || s.title || s.descripcion || personLabel(s.profesor) || 'Tutoría';
      const lugar = s.lugar || s.location || '';
      return { ...s, startDate: start, endDate: end, date: start, title: titulo, place: lugar };
    }).filter(s => s.startDate);
  }, [historial]);

  // layout constants (como en profesor)
  const dayStartHour = 8;
  const dayEndHour = 18;
  const hourHeight = 56;
  const totalHours = dayEndHour - dayStartHour;
  const headerHeight = 40;
  const timelineHeight = totalHours * hourHeight;

  const sessionsByDay = useMemo(() => {
    const map = {};
    daysOfWeek.forEach((d) => { map[d.toDateString()] = []; });
    (parsedHistorial || []).forEach((s) => {
      const key = (s.date || s.startDate || new Date()).toDateString();
      if (map[key]) map[key].push(s);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
    });
    return map;
  }, [parsedHistorial, daysOfWeek]);

  const prevWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(startOfWeek(d)); };
  const nextWeek = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(startOfWeek(d)); };

  const openSession = (s) => setSelectedSession(s);
  const closeSession = () => setSelectedSession(null);

  // -----------------------
  // fin historial
  // -----------------------

  // -----------------------
  // Mis Tutorías (confirmadas)
  // -----------------------
  const [misTutorias, setMisTutorias] = useState([]);
  const [loadingMisTutorias, setLoadingMisTutorias] = useState(false);

  useEffect(() => {
    if (!activeSubsection || String(activeSubsection).toLowerCase() !== 'mis-tutorias') return;
    let cancelled = false;
    const load = async () => {
      setLoadingMisTutorias(true);
      try {
        const uid = user && (user._id || user.id);
        if (!uid) {
          setMisTutorias([]);
          setLoadingMisTutorias(false);
          return;
        }
        let res = await fetchApi(`/api/tutorias?estudiante=${encodeURIComponent(uid)}&estado=confirmada`);
        if (!res.ok) {
          // fallback a endpoint sin filtro de estado
          res = await fetchApi(`/api/tutorias?estudiante=${encodeURIComponent(uid)}`);
        }
        if (!res.ok) throw new Error('No se pudieron cargar las tutorías');
        let data = await res.json();
        // filtrar confirmadas en cliente si el backend no lo hizo
        if (Array.isArray(data)) {
          data = data.filter(t => {
            const estado = (t.estado || t.status || '').toString().toLowerCase();
            return estado === 'confirmada' || estado === 'confirmed' || estado === 'confirmado';
          });
        }
        if (!cancelled) setMisTutorias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando mis tutorías', err);
        if (!cancelled) setMisTutorias([]);
      } finally {
        if (!cancelled) setLoadingMisTutorias(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeSubsection, user]);

  const parsedMisTutorias = useMemo(() => {
    return (misTutorias || []).map((s) => {
      const start = s.fechaInicio ? new Date(s.fechaInicio) : s.datetime ? new Date(s.datetime) : null;
      const end = s.fechaFin ? new Date(s.fechaFin) : (s.fechaInicio ? new Date(new Date(s.fechaInicio).getTime() + 30*60000) : null);
      const titulo = s.tema || s.title || s.descripcion || personLabel(s.profesor) || 'Tutoría';
      const lugar = s.lugar || s.location || '';
      return { ...s, startDate: start, endDate: end, title: titulo, place: lugar };
    }).filter(s => s.startDate).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [misTutorias]);

  // -----------------------
  // fin Mis Tutorías
  // -----------------------

  // -----------------------
  // Solicitudes pendientes
  // -----------------------
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    if (!activeSubsection || String(activeSubsection).toLowerCase() !== 'profesores') return;
    let cancelled = false;
    const load = async () => {
      setLoadingSolicitudes(true);
      try {
        const uid = user && (user._id || user.id);
        if (!uid) {
          setSolicitudesPendientes([]);
          setLoadingSolicitudes(false);
          return;
        }
        let res = await fetchApi(`/api/tutorias?estudiante=${encodeURIComponent(uid)}&estado=pendiente`);
        if (!res.ok) {
          // fallback a endpoint sin filtro de estado
          res = await fetchApi(`/api/tutorias?estudiante=${encodeURIComponent(uid)}`);
        }
        if (!res.ok) throw new Error('No se pudieron cargar las solicitudes');
        let data = await res.json();
        // filtrar pendientes en cliente si el backend no lo hizo
        if (Array.isArray(data)) {
          data = data.filter(t => {
            const estado = (t.estado || t.status || '').toString().toLowerCase();
            return estado === 'pendiente' || estado === 'pending';
          });
        }
        if (!cancelled) setSolicitudesPendientes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error cargando solicitudes pendientes', err);
        if (!cancelled) setSolicitudesPendientes([]);
      } finally {
        if (!cancelled) setLoadingSolicitudes(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeSubsection, user]);

  const parsedSolicitudes = useMemo(() => {
    return (solicitudesPendientes || []).map((s) => {
      const start = s.fechaInicio ? new Date(s.fechaInicio) : s.datetime ? new Date(s.datetime) : null;
      const end = s.fechaFin ? new Date(s.fechaFin) : (s.fechaInicio ? new Date(new Date(s.fechaInicio).getTime() + 30*60000) : null);
      const titulo = s.tema || s.title || s.descripcion || personLabel(s.profesor) || 'Tutoría';
      const lugar = s.lugar || s.location || '';
      return { ...s, startDate: start, endDate: end, title: titulo, place: lugar };
    }).filter(s => s.startDate).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  }, [solicitudesPendientes]);

  const handleCancelarSolicitud = async (tutoriaId) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return;
    
    setProcessingAction(tutoriaId);
    try {
      const res = await fetchApi(`/api/tutorias/${encodeURIComponent(tutoriaId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'No se pudo cancelar la solicitud');
      }
      // Recargar solicitudes
      setSolicitudesPendientes(prev => prev.filter(s => (s._id || s.id) !== tutoriaId));
      alert('Solicitud cancelada correctamente');
    } catch (err) {
      console.error('Error cancelando solicitud', err);
      alert('No se pudo cancelar la solicitud: ' + (err.message || 'error'));
    } finally {
      setProcessingAction(null);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      {/* Vista SOLICITUDES PENDIENTES */}
      {activeSubsection === 'profesores' ? (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Solicitudes Pendientes</h3>
            <p className="text-sm text-gray-500 mt-1">Tutorías en espera de confirmación del profesor</p>
          </div>

          {loadingSolicitudes ? (
            <div className="text-center py-8 text-gray-500">Cargando solicitudes...</div>
          ) : parsedSolicitudes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-2">⏳</div>
              <div className="text-sm text-gray-500">No tienes solicitudes pendientes en este momento</div>
            </div>
          ) : (
            <div className="space-y-4">
              {parsedSolicitudes.map((tutoria) => {
                const start = new Date(tutoria.startDate);
                const end = tutoria.endDate ? new Date(tutoria.endDate) : null;
                const isPast = start < new Date();
                
                return (
                  <div
                    key={tutoria._id || tutoria.id || `${tutoria.startDate}-${tutoria.title}`}
                    className={`bg-white border-l-4 border-yellow-500 rounded-lg shadow-sm hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                              PENDIENTE
                            </span>
                            {isPast && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                Fecha pasada
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-gray-800 text-lg leading-tight mb-1">
                            {tutoria.title || 'Tutoría'}
                          </h4>
                          <div className="text-sm text-gray-500">
                            Profesor: {tutoria.profesor ? personLabel(tutoria.profesor) : 'Sin asignar'}
                          </div>
                        </div>
                        <button
                          onClick={() => openSession(tutoria)}
                          className="text-violet-600 hover:text-violet-700 p-2"
                          title="Ver detalles"
                        >
                          <span className="text-xl">ℹ️</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-violet-600">📅</span>
                            <span>{start.toLocaleDateString('es-ES', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-violet-600">🕐</span>
                            <span>
                              {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              {end ? ` - ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {tutoria.modalidad && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="text-violet-600">{tutoria.modalidad === 'online' ? '💻' : '🏫'}</span>
                              <span className="capitalize">{tutoria.modalidad}</span>
                            </div>
                          )}
                          {tutoria.lugar && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span className="text-violet-600">📍</span>
                              <span className="truncate">{tutoria.lugar}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {tutoria.descripcion && (
                        <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                          <div className="text-xs text-gray-500 mb-1">Descripción:</div>
                          <div className="text-gray-700">{tutoria.descripcion}</div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSession(tutoria);
                          }}
                          className="flex-1 px-4 py-2 bg-violet-50 text-violet-600 hover:bg-violet-100 rounded-md font-medium text-sm transition-colors"
                        >
                          Ver detalles
                        </button>
                        <button
                          onClick={() => handleCancelarSolicitud(tutoria._id || tutoria.id)}
                          disabled={processingAction === (tutoria._id || tutoria.id)}
                          className="flex-1 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingAction === (tutoria._id || tutoria.id) ? 'Cancelando...' : 'Cancelar solicitud'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Vista MIS TUTORIAS para alumno */}
      {activeSubsection === 'mis-tutorias' ? (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Mis Tutorías Confirmadas</h3>
            <p className="text-sm text-gray-500 mt-1">Todas tus tutorías confirmadas y próximas</p>
          </div>

          {loadingMisTutorias ? (
            <div className="text-center py-8 text-gray-500">Cargando tutorías...</div>
          ) : parsedMisTutorias.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-2">📅</div>
              <div className="text-sm text-gray-500">No tienes tutorías confirmadas en este momento</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {parsedMisTutorias.map((tutoria) => {
                const start = new Date(tutoria.startDate);
                const end = tutoria.endDate ? new Date(tutoria.endDate) : null;
                const isPast = start < new Date();
                
                return (
                  <div
                    key={tutoria._id || tutoria.id || `${tutoria.startDate}-${tutoria.title}`}
                    className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${isPast ? 'opacity-75' : ''}`}
                    onClick={() => openSession(tutoria)}
                  >
                    <div className="h-2 bg-gradient-to-r from-green-600 to-green-400" />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg leading-tight mb-1">
                            {tutoria.title || 'Tutoría'}
                          </h4>
                          <div className="text-sm text-gray-500">
                            {tutoria.profesor ? personLabel(tutoria.profesor) : 'Profesor'}
                          </div>
                        </div>
                        {isPast && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Pasada
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-violet-600">📅</span>
                          <span>{start.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-violet-600">🕐</span>
                          <span>
                            {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            {end ? ` - ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                        {tutoria.modalidad && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-violet-600">{tutoria.modalidad === 'online' ? '💻' : '🏫'}</span>
                            <span className="capitalize">{tutoria.modalidad}</span>
                          </div>
                        )}
                        {tutoria.lugar && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-violet-600">📍</span>
                            <span className="truncate">{tutoria.lugar}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSession(tutoria);
                          }}
                          className="w-full text-center text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Ver detalles →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {/* Vista HISTORIAL para alumno */}
      {activeSubsection === 'historial' ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">«</button>
              <div className="text-sm text-gray-600">
                {daysOfWeek && daysOfWeek[0] ? daysOfWeek[0].toLocaleDateString() : ''} - {daysOfWeek && daysOfWeek[Math.min(4, daysOfWeek.length-1)] ? daysOfWeek[Math.min(4, daysOfWeek.length-1)].toLocaleDateString() : ''}
              </div>
              <button onClick={nextWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">»</button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Historial de tutorías</h3>
            </div>
          </div>

          <div className="border rounded overflow-hidden shadow-sm">
            <div className="flex">
              <div className="w-20 border-r border-violet-600 bg-violet-700" style={{ height: headerHeight }} />
              <div className="flex-1 grid grid-cols-5">
                {daysOfWeek.map((day) => (
                  <div key={day.toDateString()} style={{ height: headerHeight }} className="flex items-center justify-center text-sm font-semibold text-white bg-violet-700 border-b border-violet-600">
                    <div className="truncate">{day.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()} {day.getDate()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: timelineHeight }} className="flex overflow-y-auto relative">
              <div className="w-20 bg-violet-700 border-r border-violet-600">
                {Array.from({ length: totalHours }).map((_, idx) => {
                  const h = dayStartHour + idx;
                  return (
                    <div key={h} style={{ height: hourHeight }} className="text-xs text-right flex items-center justify-end pr-3 border-b border-violet-600 text-white">
                      {`${String(h).padStart(2, '0')}:00`}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 grid grid-cols-5" style={{ minWidth: 0 }}>
                {daysOfWeek.map((day) => {
                  const key = day.toDateString();
                  const items = sessionsByDay[key] || [];
                  return (
                    <div key={key} className="relative border-l border-violet-600" style={{ height: timelineHeight }}>
                      {Array.from({ length: totalHours }).map((_, i) => (
                        <div key={i} style={{ height: hourHeight }} className="border-b border-dashed border-violet-600/30"></div>
                      ))}

                      {items.map((s) => {
                        const start = new Date(s.startDate);
                        const end = s.endDate ? new Date(s.endDate) : new Date(start.getTime() + 30*60000);
                        const minutesFromStart = (start.getHours() + start.getMinutes()/60 - dayStartHour) * hourHeight;
                        const durationHours = Math.max((end - start)/3600000, 0.25);
                        const blockHeight = Math.max(40, durationHours * hourHeight);
                        const estado = (s.estado || s.status || '').toString().toLowerCase();
                        const isConfirmada = estado === 'confirmada' || estado === 'confirmed' || estado === 'confirmado';
                        const isPendiente = estado === 'pendiente' || estado === 'pending';
                        const gradientClass = isConfirmada ? 'from-green-600 to-green-400' : isPendiente ? 'from-yellow-600 to-violet-400' : 'from-violet-800 to-yellow-600';
                        const leftBarClass = isConfirmada ? 'bg-green-300' : isPendiente ? 'bg-yellow-300' : 'bg-white/30';

                        return (
                          <div
                            key={s._id || s.id || `${s.startDate}-${s.title}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => openSession(s)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openSession(s); }}
                            className="absolute left-3 right-3 rounded-lg shadow-lg cursor-pointer"
                            style={{ top: `${Math.max(0, minutesFromStart)}px`, height: `${blockHeight}px`, overflow: 'hidden' }}
                            title={`${s.title || 'Tutoría'}${s.modalidad ? ' — ' + s.modalidad : ''}`}
                          >
                            <div className="h-full flex">
                              <div className={`w-1 ${leftBarClass} rounded-l-md`} />
                              <div className={`flex-1 bg-gradient-to-r ${gradientClass} text-white p-2 rounded-r-lg`}>
                                <div className="text-sm font-semibold leading-tight truncate">{s.title || 'Tutoría'}</div>
                                <div className="text-xs leading-tight">{(start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}))}{end ? ` - ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : ''}</div>
                                <div className="text-xs opacity-90 mt-1 truncate">{s.modalidad || ''}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* modal detalle */}
          {selectedSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" onClick={closeSession} />
              <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl overflow-auto max-h-[80vh]">
                <div className="flex items-start justify-between p-4 border-b">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedSession.title || selectedSession.tema || 'Tutoría'}</h3>
                    <div className="text-xs text-gray-500 mt-1">
                      Profesor: {selectedSession.profesor ? personLabel(selectedSession.profesor) : 'Sin asignar'}
                    </div>
                    {selectedSession.estado && (
                      <div className="mt-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                          (selectedSession.estado || '').toLowerCase() === 'confirmada' || (selectedSession.estado || '').toLowerCase() === 'confirmed'
                            ? 'bg-green-100 text-green-700'
                            : (selectedSession.estado || '').toLowerCase() === 'pendiente' || (selectedSession.estado || '').toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {selectedSession.estado}
                        </span>
                      </div>
                    )}
                  </div>
                  <button onClick={closeSession} className="text-gray-500 hover:text-gray-700 ml-4 text-xl">✕</button>
                </div>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Fecha y hora</div>
                    <div className="text-sm text-gray-700">
                      📅 {selectedSession.startDate ? new Date(selectedSession.startDate).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }) : 'No especificada'}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">
                      🕐 {selectedSession.startDate ? new Date(selectedSession.startDate).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : ''}
                      {selectedSession.endDate ? ` - ${new Date(selectedSession.endDate).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}` : ''}
                    </div>
                  </div>

                  {selectedSession.descripcion && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">Descripción</div>
                      <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded">
                        {selectedSession.descripcion}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedSession.modalidad && (
                      <div>
                        <div className="text-xs text-gray-500 font-semibold mb-1">Modalidad</div>
                        <div className="text-sm text-gray-700 flex items-center gap-2">
                          <span>{selectedSession.modalidad === 'online' ? '💻' : '🏫'}</span>
                          <span className="capitalize">{selectedSession.modalidad}</span>
                        </div>
                      </div>
                    )}
                    {selectedSession.lugar && (
                      <div>
                        <div className="text-xs text-gray-500 font-semibold mb-1">Lugar</div>
                        <div className="text-sm text-gray-700 flex items-center gap-2">
                          <span>📍</span>
                          <span>{selectedSession.lugar}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedSession.estudiante && (
                    <div>
                      <div className="text-xs text-gray-500 font-semibold mb-1">Estudiante</div>
                      <div className="text-sm text-gray-700">
                        {personLabel(selectedSession.estudiante)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex gap-2">
                  <button
                    onClick={closeSession}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cerrar
                  </button>
                  {((selectedSession.estado || '').toLowerCase() === 'pendiente' || (selectedSession.estado || '').toLowerCase() === 'pending') && (
                    <button
                      onClick={() => {
                        closeSession();
                        handleCancelarSolicitud(selectedSession._id || selectedSession.id);
                      }}
                      disabled={processingAction === (selectedSession._id || selectedSession.id)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingAction === (selectedSession._id || selectedSession.id) ? 'Cancelando...' : 'Cancelar tutoría'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex flex-col items-start justify-start min-h-[300px] sm:min-h-[400px] lg:min-h-[500px]">
        <div className="text-left w-full">
          {activeSubsection === 'reservar' ? (
            <div className="mt-6 w-full">
              <h3 className="text-md font-semibold text-gray-800 mb-3">Profesores con horarios</h3>
              {loading ? <div className="text-sm text-gray-500">Cargando...</div> : null}
              {profesores.length === 0 ? (
                <div className="text-sm text-gray-500">No hay profesores disponibles en este momento.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profesores.map((p) => (
                    <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col justify-between items-start">
                      <div className="flex gap-4 items-start w-full">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-700">
                            {(p.name || 'P').split(' ').map(n => n?.[0] || '').slice(0,2).join('').toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-800">{p.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{p.horarios.length} {p.horarios.length === 1 ? 'sesion' : 'franjas'}</div>
                          <ul className="mt-3 p-0 text-sm text-gray-600 space-y-1 max-h-28 overflow-auto pr-2 text-left">
                            {p.horarios.slice(0, 6).map((h) => (
                              <li key={h._id || `${p.id}-${h.diaSemana}-${h.horaInicio}`} className="flex items-center gap-2">
                                <span>{h.asignatura ? `${h.asignatura} · ` : ''}{h.diaSemana} {h.horaInicio} - {h.horaFin}{h.modalidad ? <span className="text-xs text-gray-400 ml-2">· {h.modalidad}</span> : null}</span>
                              </li>
                            ))}
                            {p.horarios.length > 6 && <li className="text-xs text-gray-400">...y más</li>}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 w-full">
                        <button onClick={() => onReservar(p)} className="w-full px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-md">Reservar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null
          }
        </div>
      </div>

      {/* Drawer / slide form */}
      {showReserveDrawer && reservedProfessor && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1" onClick={closeReserve} />
          <div className="w-full sm:w-96 bg-white shadow-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Reservar con {reservedProfessor.name}</h4>
              <button onClick={closeReserve} className="text-gray-600">Cerrar</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Huecos disponibles (30 min)</label>
                <div className="mt-2 max-h-48 overflow-auto border rounded p-2">
                  {availableSlots.length === 0 ? <div className="text-sm text-gray-500">No hay huecos disponibles en los próximos días.</div> : availableSlots.map((s) => (
                    <label key={s.isoStart} className="flex items-center gap-2 text-sm p-1 cursor-pointer">
                      <input type="radio" name="slot" checked={selectedSlot && selectedSlot.isoStart === s.isoStart} onChange={() => setSelectedSlot(s)} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Tema</label>
                <input value={tema} onChange={(e) => setTema(e.target.value)} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="text-xs text-gray-500">Descripción (opcional)</label>
                <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="w-full p-2 border rounded" rows={3} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Modalidad</label>
                  <select value={modalidadReserva} onChange={(e) => setModalidadReserva(e.target.value)} className="w-full p-2 border rounded">
                    <option value="presencial">presencial</option>
                    <option value="online">online</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Lugar (opcional)</label>
                  <input value={lugarReserva} onChange={(e) => setLugarReserva(e.target.value)} className="w-full p-2 border rounded" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={closeReserve} className="px-3 py-1 bg-gray-200 rounded">Cancelar</button>
                <button onClick={submitReserva} disabled={saving || !selectedSlot} className="px-3 py-1 bg-violet-600 text-white rounded">
                  {saving ? 'Reservando...' : 'Confirmar reserva'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle - disponible en todas las secciones */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={closeSession} />
          <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl overflow-auto max-h-[80vh]">
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedSession.title || selectedSession.tema || 'Tutoría'}</h3>
                <div className="text-xs text-gray-500 mt-1">
                  Profesor: {selectedSession.profesor ? personLabel(selectedSession.profesor) : 'Sin asignar'}
                </div>
                {selectedSession.estado && (
                  <div className="mt-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      (selectedSession.estado || '').toLowerCase() === 'confirmada' || (selectedSession.estado || '').toLowerCase() === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : (selectedSession.estado || '').toLowerCase() === 'pendiente' || (selectedSession.estado || '').toLowerCase() === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedSession.estado}
                    </span>
                  </div>
                )}
              </div>
              <button onClick={closeSession} className="text-gray-500 hover:text-gray-700 ml-4 text-xl">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="text-xs text-gray-500 font-semibold mb-1">Fecha y hora</div>
                <div className="text-sm text-gray-700">
                  📅 {selectedSession.startDate ? new Date(selectedSession.startDate).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  }) : 'No especificada'}
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  🕐 {selectedSession.startDate ? new Date(selectedSession.startDate).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : ''}
                  {selectedSession.endDate ? ` - ${new Date(selectedSession.endDate).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}` : ''}
                </div>
              </div>

              {selectedSession.descripcion && (
                <div>
                  <div className="text-xs text-gray-500 font-semibold mb-1">Descripción</div>
                  <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded">
                    {selectedSession.descripcion}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSession.modalidad && (
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Modalidad</div>
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <span>{selectedSession.modalidad === 'online' ? '💻' : '🏫'}</span>
                      <span className="capitalize">{selectedSession.modalidad}</span>
                    </div>
                  </div>
                )}
                {selectedSession.lugar && (
                  <div>
                    <div className="text-xs text-gray-500 font-semibold mb-1">Lugar</div>
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <span>📍</span>
                      <span>{selectedSession.lugar}</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedSession.estudiante && (
                <div>
                  <div className="text-xs text-gray-500 font-semibold mb-1">Estudiante</div>
                  <div className="text-sm text-gray-700">
                    {personLabel(selectedSession.estudiante)}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={closeSession}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
              >
                Cerrar
              </button>
              {((selectedSession.estado || '').toLowerCase() === 'pendiente' || (selectedSession.estado || '').toLowerCase() === 'pending') && (
                <button
                  onClick={() => {
                    closeSession();
                    handleCancelarSolicitud(selectedSession._id || selectedSession.id);
                  }}
                  disabled={processingAction === (selectedSession._id || selectedSession.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingAction === (selectedSession._id || selectedSession.id) ? 'Cancelando...' : 'Cancelar tutoría'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutoriasAlumno;
