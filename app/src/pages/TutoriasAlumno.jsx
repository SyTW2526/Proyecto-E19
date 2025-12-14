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

  // Reserva form state (sin drawer, ahora es widget lateral)
  const [reservedProfessor, setReservedProfessor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]); // { isoStart, isoEnd, label }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [tema, setTema] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [modalidadReserva, setModalidadReserva] = useState('presencial');
  const [lugarReserva, setLugarReserva] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

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
          if (!p.id || p.id === 'sin-profesor') return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios, asignaturas: [] };
          try {
            // prefer /api/usuarios
            let r = await fetchApi(`/api/usuarios/${encodeURIComponent(p.id)}`);
            if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(p.id)}`);
            if (!r.ok) throw new Error('no user');
            const u = await r.json();
            const name = u.name || u.username || u.fullName || (u.email ? u.email.split('@')[0] : 'Profesor');
            // Extraer asignaturas únicas de los horarios
            const asignaturas = [...new Set(p.horarios.map(h => h.asignatura).filter(Boolean))];
            return { id: p.id, name, horarios: p.horarios, asignaturas };
          } catch {
            return { id: p.id, name: 'Profesor desconocido', horarios: p.horarios, asignaturas: [] };
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

  // open reservation form for a professor
  const openReserve = (prof) => {
    setReservedProfessor(prof);
    const slots = computeSlotsForProfessor(prof, 14);
    setAvailableSlots(slots);
    setSelectedSlot(slots[0] || null);
    setTema('');
    setDescripcion('');
    setModalidadReserva('presencial');
    setLugarReserva('');
  };

  // submit Tutoria to server (use /api/tutorias)
  const submitReserva = async () => {
    if (!reservedProfessor || !selectedSlot) {
      setMessage({ type: 'error', text: 'Selecciona un hueco de 30 min.' });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    if (!user || !(user._id || user.id)) {
      setMessage({ type: 'error', text: 'Usuario no identificado.' });
      setTimeout(() => setMessage(null), 5000);
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
      // Limpiar formulario tras reserva exitosa
      setReservedProfessor(null);
      setAvailableSlots([]);
      setSelectedSlot(null);
      setTema('');
      setDescripcion('');
      setMessage({ type: 'success', text: 'Tutoría creada correctamente' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error('Error creando tutoria', err);
      setMessage({ type: 'error', text: 'No se pudo crear la tutoría: ' + (err.message || 'error') });
      setTimeout(() => setMessage(null), 5000);
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
    return p.name || p.fullName || p.username || p.email || String(p._id || '');
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
        
        // Cargar nombres de profesores si vienen como IDs
        if (Array.isArray(data)) {
          data = await Promise.all(data.map(async (t) => {
            if (t.profesor && typeof t.profesor === 'string') {
              try {
                let r = await fetchApi(`/api/usuarios/${encodeURIComponent(t.profesor)}`);
                if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(t.profesor)}`);
                if (r.ok) {
                  const prof = await r.json();
                  return { ...t, profesor: prof };
                }
              } catch (e) {
                console.error('Error cargando profesor', e);
              }
            }
            return t;
          }));
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [tutoriaToCancel, setTutoriaToCancel] = useState(null);

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
        
        // Cargar nombres de profesores si vienen como IDs
        if (Array.isArray(data)) {
          data = await Promise.all(data.map(async (t) => {
            if (t.profesor && typeof t.profesor === 'string') {
              try {
                let r = await fetchApi(`/api/usuarios/${encodeURIComponent(t.profesor)}`);
                if (!r.ok) r = await fetchApi(`/api/users/${encodeURIComponent(t.profesor)}`);
                if (r.ok) {
                  const prof = await r.json();
                  return { ...t, profesor: prof };
                }
              } catch (e) {
                console.error('Error cargando profesor', e);
              }
            }
            return t;
          }));
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

  const handleCancelarSolicitud = async (tutoria) => {
    setTutoriaToCancel(tutoria);
    setShowCancelModal(true);
  };

  const confirmCancelTutoria = async () => {
    if (!tutoriaToCancel) return;
    
    const tutoriaId = tutoriaToCancel._id || tutoriaToCancel.id;
    setProcessingAction(tutoriaId);
    
    try {
      const res = await fetchApi(`/api/tutorias/${encodeURIComponent(tutoriaId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'No se pudo cancelar la solicitud');
      }
      // Recargar solicitudes y mis tutorías
      setSolicitudesPendientes(prev => prev.filter(s => (s._id || s.id) !== tutoriaId));
      setMisTutorias(prev => prev.filter(t => (t._id || t.id) !== tutoriaId));
      setMessage({ type: 'success', text: 'Tutoría cancelada correctamente' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error('Error cancelando tutoría', err);
      setMessage({ type: 'error', text: 'No se pudo cancelar la tutoría: ' + (err.message || 'error') });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setProcessingAction(null);
      setShowCancelModal(false);
      setTutoriaToCancel(null);
    }
  };

  return (
    <div className="mt-4">
      {/* Vista SOLICITUDES PENDIENTES */}
      {activeSubsection === 'profesores' ? (
        <div>
          {loadingSolicitudes ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7024BB]"></div>
            </div>
          ) : parsedSolicitudes.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">No tienes solicitudes pendientes</p>
              <p className="text-gray-400 text-sm mt-2">Tus solicitudes de tutoría aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {parsedSolicitudes.map((tutoria) => {
                const start = new Date(tutoria.startDate);
                const end = tutoria.endDate ? new Date(tutoria.endDate) : null;
                const isPast = start < new Date();
                
                return (
                  <div
                    key={tutoria._id || tutoria.id || `${tutoria.startDate}-${tutoria.title}`}
                    className="p-4 rounded-xl bg-gray-50 hover:ring-2 hover:ring-yellow-400 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Info principal */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">{tutoria.title || 'Tutoría'}</h4>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full flex-shrink-0">
                            Pendiente
                          </span>
                          {isPast && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex-shrink-0">
                              Pasada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {tutoria.profesor ? personLabel(tutoria.profesor) : 'Profesor sin asignar'}
                        </p>
                      </div>

                      {/* Detalles horizontales */}
                      <div className="flex items-center gap-4 text-sm text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-[#7024BB] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="hidden sm:inline">{start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-[#7024BB] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {tutoria.modalidad && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-[#7024BB] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tutoria.modalidad === 'online' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' : 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'} />
                            </svg>
                            <span className="hidden md:inline capitalize">{tutoria.modalidad}</span>
                          </div>
                        )}
                      </div>

                      {/* Botón cancelar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelarSolicitud(tutoria);
                        }}
                        disabled={processingAction === (tutoria._id || tutoria.id)}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {processingAction === (tutoria._id || tutoria.id) ? 'Cancelando...' : 'Cancelar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mensaje de confirmación/error */}
          {message && (
            <div className={`mt-4 p-4 rounded-xl border-2 font-medium ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{message.type === 'error' ? '⚠️' : '✅'}</span>
                <span>{message.text}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Vista MIS TUTORIAS para alumno */}
      {activeSubsection === 'mis-tutorias' ? (
        <div>
          {loadingMisTutorias && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7024BB]"></div>
            </div>
          )}

          {!loadingMisTutorias && parsedMisTutorias.length === 0 && (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg">No tienes tutorías confirmadas</p>
              <p className="text-gray-400 text-sm mt-2">Ve a "Reservar tutoría" para agendar tu primera sesión</p>
            </div>
          )}

          {!loadingMisTutorias && parsedMisTutorias.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parsedMisTutorias.map((tutoria) => {
                const start = new Date(tutoria.startDate);
                const end = tutoria.endDate ? new Date(tutoria.endDate) : null;
                const isPast = start < new Date();
                
                return (
                  <div
                    key={tutoria._id || tutoria.id || `${tutoria.startDate}-${tutoria.title}`}
                    className="p-5 rounded-xl bg-gray-50 hover:ring-2 hover:ring-[#7024BB] transition-all cursor-pointer"
                    onClick={() => openSession(tutoria)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{tutoria.title || 'Tutoría'}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {tutoria.profesor ? personLabel(tutoria.profesor) : 'Profesor'}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                        isPast
                          ? 'bg-gray-50 text-gray-600 border border-gray-200'
                          : 'bg-green-50 text-green-700 border border-green-200'
                      }`}>
                        {isPast ? (
                          <>⏱ Pasada</>
                        ) : (
                          <>✓ Confirmada</>
                        )}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{start.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          {end ? ` - ${end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ''}
                        </span>
                      </div>
                      {tutoria.modalidad && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tutoria.modalidad === 'online' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' : 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'} />
                          </svg>
                          <span className="capitalize">{tutoria.modalidad}</span>
                        </div>
                      )}
                      {tutoria.lugar && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{tutoria.lugar}</span>
                        </div>
                      )}
                    </div>

                    {!isPast && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelarSolicitud(tutoria);
                        }}
                        disabled={processingAction === (tutoria._id || tutoria.id)}
                        className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        {processingAction === (tutoria._id || tutoria.id) ? 'Cancelando...' : 'Cancelar tutoría'}
                      </button>
                    )}
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

      {/* Vista RESERVAR - Layout de 2 columnas igual a ReservaEspacios */}
      {activeSubsection === 'reservar' ? (
        <div className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Widget izquierdo: Lista de profesores */}
            <div className="col-span-1">
              <section className="p-6 rounded-xl bg-gray-50 h-full">
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Profesores disponibles</h4>
                </div>
                
                {loading && <p className="text-sm text-gray-500">Cargando profesores...</p>}
                
                {/* Lista de profesores */}
                <div className="space-y-3">
                  {profesores.length === 0 && !loading ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm text-gray-500">No hay profesores disponibles</p>
                    </div>
                  ) : (
                    profesores.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onReservar(p)}
                        className={`w-full text-left p-4 rounded-xl transition-all ${
                          reservedProfessor && reservedProfessor.id === p.id
                            ? 'bg-white ring-2 ring-[#7024BB]' 
                            : 'bg-white hover:bg-[#f5f0ff]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{p.name}</div>
                            {p.asignaturas && p.asignaturas.length > 0 && (
                              <div className="text-xs text-[#7024BB] font-medium mt-1">
                                {p.asignaturas.join(', ')}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1">{p.horarios.length} {p.horarios.length === 1 ? 'franja disponible' : 'franjas disponibles'}</div>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {p.horarios.length}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                  </div>
              </section>
            </div>

            {/* Widget derecho: Detalle y formulario de reserva */}
            <div className="col-span-1">
              <section className="p-6 rounded-xl bg-gray-50 h-full">
                <h3 className="sr-only">Detalle y reserva</h3>
                
                {!reservedProfessor && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-sm">Selecciona un profesor para ver los horarios disponibles</p>
                    </div>
                  </div>
                )}

                {reservedProfessor && (
                  <div className="space-y-6">
                    {/* Encabezado del profesor */}
                    <div className="pb-4 border-b border-gray-200">
                      <h4 className="font-bold text-xl text-gray-900">{reservedProfessor.name}</h4>
                      {reservedProfessor.asignaturas && reservedProfessor.asignaturas.length > 0 && (
                        <div className="text-sm text-[#7024BB] font-medium mt-1">
                          {reservedProfessor.asignaturas.join(' • ')}
                        </div>
                      )}
                      <p className="text-sm text-gray-600 mt-2">Selecciona un horario y completa los detalles</p>
                    </div>

                    {/* Formulario de reserva */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Huecos disponibles (30 min)</label>
                      <div className="max-h-48 overflow-auto border border-gray-300 rounded-xl p-3 bg-white">
                        {availableSlots.length === 0 ? (
                          <div className="text-center py-4 text-sm text-gray-500">No hay huecos disponibles en los próximos días</div>
                        ) : (
                          <div className="space-y-2">
                            {availableSlots.map((s) => (
                              <label 
                                key={s.isoStart} 
                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                  selectedSlot && selectedSlot.isoStart === s.isoStart 
                                    ? 'bg-[#7024BB] text-white' 
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <input 
                                  type="radio" 
                                  name="slot" 
                                  checked={selectedSlot && selectedSlot.isoStart === s.isoStart} 
                                  onChange={() => setSelectedSlot(s)}
                                  className="w-4 h-4"
                                />
                                <span className="flex-1 text-sm font-medium">{s.label}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Tema</label>
                      <input 
                        type="text" 
                        value={tema} 
                        onChange={(e) => setTema(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all" 
                        placeholder="Ej: Consulta sobre el proyecto"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                      <textarea 
                        value={descripcion} 
                        onChange={(e) => setDescripcion(e.target.value)} 
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all" 
                        rows={3}
                        placeholder="Agrega detalles adicionales..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Modalidad</label>
                        <select 
                          value={modalidadReserva} 
                          onChange={(e) => setModalidadReserva(e.target.value)} 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                        >
                          <option value="presencial">Presencial</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lugar (opcional)</label>
                        <input 
                          type="text"
                          value={lugarReserva} 
                          onChange={(e) => setLugarReserva(e.target.value)} 
                          className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                          placeholder="Ej: Aula 1.5"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button 
                        onClick={() => setReservedProfessor(null)} 
                        className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-300 font-medium transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={submitReserva} 
                        disabled={saving || !selectedSlot} 
                        className="flex-1 px-6 py-3 bg-[#7024BB] hover:bg-[#5a1d99] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Reservando...' : 'Reservar'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* Mensaje de confirmación/error */}
          {message && (
            <div className={`mt-4 p-4 rounded-xl border-2 font-medium ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border-red-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{message.type === 'error' ? '⚠️' : '✅'}</span>
                <span>{message.text}</span>
              </div>
            </div>
          )}
        </div>
      ) : null}

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
                    handleCancelarSolicitud(selectedSession);
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

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && tutoriaToCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowCancelModal(false); setTutoriaToCancel(null); }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">¿Cancelar tutoría?</h3>
              <p className="text-sm text-gray-600 text-center">
                ¿Estás seguro de que quieres cancelar la tutoría <strong>{tutoriaToCancel.title || tutoriaToCancel.tema || 'esta tutoría'}</strong>{tutoriaToCancel.profesor ? ` con ${personLabel(tutoriaToCancel.profesor)}` : ''}?
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowCancelModal(false); setTutoriaToCancel(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                No, volver
              </button>
              <button 
                onClick={confirmCancelTutoria}
                disabled={processingAction}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                {processingAction ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutoriasAlumno;
