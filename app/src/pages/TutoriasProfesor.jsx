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
  // solicitudes pendientes (estado)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  // mis tutorías (confirmadas) para el profesor actual
  const [mySessions, setMySessions] = useState([]);
  const [loadingMySessions, setLoadingMySessions] = useState(false);
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
  // edición inline
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
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
    'http://localhost:5173'
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
  
  // --- solicitudes pendientes: cargar y acciones (usa el ObjectId del usuario actual) ---
  const loadPendingRequests = async () => {
    const uid = getCurrentUserId();
    if (!uid) {
      setPendingRequests([]);
      return;
    }
    setLoadingPending(true);
    try {
      // Preferimos consultar por profesor=<uid> y estado pendiente
      let res = await fetchApi(`/api/tutorias?profesor=${encodeURIComponent(uid)}&estado=pendiente`);
      // fallback a ruta alternativa si es necesario
      if (!res.ok) res = await fetchApi(`/api/tutorias?profesorId=${encodeURIComponent(uid)}&estado=pendiente`);
      if (!res.ok) {
        setPendingRequests([]);
        return;
      }
      const data = await res.json();
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando solicitudes pendientes:', err);
      setPendingRequests([]);
    } finally {
      setLoadingPending(false);
    }
  };

  useEffect(() => {
    if (tab === 'profesores') loadPendingRequests();
  }, [tab]);

  // cargar tutorías confirmadas del profesor para "mis-tutorias"
  const loadMySessions = async () => {
    const uid = getCurrentUserId();
    if (!uid) {
      setMySessions([]);
      return;
    }
    setLoadingMySessions(true);
    try {
      let res = await fetchApi(`/api/tutorias?profesor=${encodeURIComponent(uid)}&estado=confirmada`);
      if (!res.ok) res = await fetchApi(`/api/tutorias?profesorId=${encodeURIComponent(uid)}&estado=confirmada`);
      if (!res.ok) { setMySessions([]); return; }
      const data = await res.json();
      setMySessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando mis tutorías confirmadas:', err);
      setMySessions([]);
    } finally {
      setLoadingMySessions(false);
    }
  };

  useEffect(() => {
    if (tab === 'mis-tutorias') loadMySessions();
  }, [tab]);

  const acceptRequest = async (id) => {
    if (!confirm('Aceptar esta tutoría?')) return;
    try {
      const res = await fetchApi(`/api/tutorias/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'confirmada' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadPendingRequests();
    } catch (err) {
      console.error('acceptRequest (PUT) error', err);
      alert('No se pudo aceptar la solicitud.');
    }
  };

  const cancelRequest = async (id) => {
    if (!confirm('¿Eliminar esta tutoría (marcar como cancelada)?')) return;
    try {
      const res = await fetchApi(`/api/tutorias/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'Cancelada' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // recargar la lista de pendientes
      await loadPendingRequests();
    } catch (err) {
      console.error('cancelRequest (PUT) error', err);
      alert('No se pudo eliminar/la marcar la solicitud como cancelada.');
    }
  };

  const reprogramRequest = async (id) => {
    const nuevoInicio = prompt('Nueva fecha/hora de inicio (ISO o YYYY-MM-DDTHH:MM):');
    if (!nuevoInicio) return;
    const nuevoFin = prompt('Nueva fecha/hora de fin (ISO o YYYY-MM-DDTHH:MM):', nuevoInicio);
    if (!nuevoFin) return;
    try {
      const res = await fetchApi(`/api/tutorias/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio: new Date(nuevoInicio).toISOString(),
          fechaFin: new Date(nuevoFin).toISOString(),
          estado: 'Reprogramada',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await loadPendingRequests();
    } catch (err) {
      console.error('reprogramRequest (PUT) error', err);
      alert('No se pudo reprogramar la solicitud.');
    }
  };

  // --- Nuevo: funciones para el menú de acciones en tabla de reservas ---
  const onToggleReserva = async (reserva) => {
    if (!reserva._id) return;
    const nuevaReserva = { ...reserva, activo: !reserva.activo };
    try {
      const res = await fetchApi(`/api/horarios/${encodeURIComponent(reserva._id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: nuevaReserva.activo }),
      });
      if (!res.ok) throw new Error('Error al actualizar reserva');
      setLocalReservas((prev) =>
        prev.map((r) => (r._id === reserva._id ? nuevaReserva : r))
      );
    } catch (err) {
      console.error('Error toggling reserva', err);
      alert('Error al actualizar reserva');
    }
  };

  const onDeleteReserva = async (reserva) => {
    if (!reserva._id) return;
    if (!confirm('¿Borrar esta reserva?')) return;
    try {
      const res = await fetchApi(`/api/horarios/${encodeURIComponent(reserva._id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al borrar reserva');
      setLocalReservas((prev) => prev.filter((r) => r._id !== reserva._id));
    } catch (err) {
      console.error('Error deleting reserva', err);
      alert('Error al borrar reserva');
    }
  };

  // --- Nuevo: estado y funciones para el modal de detalles ---
  const [detalleReserva, setDetalleReserva] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const openDetalle = (reserva) => {
    setCargandoDetalle(true);
    setDetalleReserva(null);
    fetchApi(`/api/horarios/${encodeURIComponent(reserva._id)}`)
      .then((res) => res.json())
      .then((data) => {
        setDetalleReserva(data);
        setCargandoDetalle(false);
      })
      .catch((err) => {
        console.error('Error cargando detalle de reserva', err);
        setCargandoDetalle(false);
      });
  };

  const closeDetalle = () => {
    setDetalleReserva(null);
  };

  // --- Nuevo: efecto para cargar reservas al iniciar ---
  useEffect(() => {
    if (tab === 'reservar') {
      loadUserSchedules();
    }
  }, [tab]);

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

  // --- helpers para editar horario existente ---
  const startEdit = (s) => {
    const id = s._id || s.id;
    setEditingId(id);
    setEditValues({
      horaInicio: s.horaInicio || '',
      horaFin: s.horaFin || '',
      modalidad: s.modalidad || s.modality || '',
      lugar: s.lugar || s.place || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async (id) => {
    try {
      const payload = { ...editValues };
      const res = await fetchApi(`/api/horarios/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Error actualizando');
      }
      const updated = await res.json().catch(() => null);
      // actualizar localReservas para reflejar inmediatamente el cambio
      setLocalReservas((prev) =>
        prev.map((r) => {
          const rid = r._id || r.id;
          if (rid === id) return { ...r, ...payload, ...(updated || {}) };
          return r;
        })
      );
      cancelEdit();
      // recargar desde servidor para consistencia
      await loadUserSchedules();
    } catch (err) {
      console.error('saveEdit error', err);
      alert('No se pudo guardar: ' + (err.message || ''));
    }
  };

  // Agrupar reservas por asignatura para la vista "reservar"
  const reservasGrouped = useMemo(() => {
    const map = new Map();
    (localReservas || []).forEach((r) => {
      const key = (r.asignatura || 'Sin asignatura').toString().trim() || 'Sin asignatura';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    });
    return Array.from(map.entries()).map(([asignatura, items]) => ({ asignatura, items }));
  }, [localReservas]);

  // mostrar solo las que están en estado "pendiente"
  const visiblePendingRequests = (pendingRequests || []).filter((r) => {
    const st = (r.estado || r.status || '').toString().toLowerCase();
    return st === 'pendiente' || st === 'pending';
  });

  // mostrar solo las que están confirmadas en "mis-tutorias"
  const visibleMySessions = (mySessions || []).filter((s) => {
    const st = (s.estado || s.status || '').toString().toLowerCase();
    return st === 'confirmada' || st === 'confirmado' || st === 'confirmed';
  });

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
      <div className="min-h-[300px]">
        <div className="flex items-center justify-between mb-4">

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
        {tab === 'profesores' && (
          <div className="space-y-3">
            {loadingPending ? (
              <div className="text-sm text-gray-500">Cargando solicitudes...</div>
            ) : visiblePendingRequests.length === 0 ? (
              <div className="text-sm text-gray-500">No hay solicitudes pendientes.</div>
            ) : (
              visiblePendingRequests.map((r) => (
                <div key={r._id || r.id} className="bg-white rounded-lg p-3 border shadow-sm flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">
                      {(r.estudiante && (r.estudiante.name || r.estudiante.username)) || r.alumno || 'Estudiante'}
                    </div>
                    <div className="text-xs text-gray-500">{r.tema || r.title || 'Tutoria solicitada'}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {r.fechaInicio ? new Date(r.fechaInicio).toLocaleString() : (r.fecha || '')}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    <button onClick={() => acceptRequest(r._id || r.id)} className="px-3 py-1 bg-green-500 text-white rounded">Aceptar</button>
                    <button onClick={() => cancelRequest(r._id || r.id)} className="px-3 py-1 bg-red-500 text-white rounded">Cancelar</button>
                    <button onClick={() => reprogramRequest(r._id || r.id)} className="px-3 py-1 bg-yellow-400 text-white rounded">Reprogramar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Mis tutorías (solo CONFIRMADAS del profesor actual) */}
        {tab === 'mis-tutorias' && (
          <div className="space-y-3">
            {loadingMySessions ? (
              <div className="text-sm text-gray-500">Cargando mis tutorías...</div>
            ) : visibleMySessions.length === 0 ? (
              <div className="text-sm text-gray-500">No hay tutorías confirmadas.</div>
            ) : (
              visibleMySessions.map((s) => (
                <div key={s._id || s.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-semibold">{s.alumno || (s.estudiante && (s.estudiante.name || s.estudiante.username)) || 'Estudiante'}</div>
                    <div className="text-xs text-gray-500">
                      {(s.tema || s.title || '')}{' '}{s.fechaInicio ? `· ${new Date(s.fechaInicio).toLocaleString()}` : (s.fecha ? `· ${s.fecha}` : '')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">Ver detalles</div>
                </div>
              ))
            )}
          </div>
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

            <div className="space-y-4">
              {reservasGrouped.length === 0 ? (
                <div className="text-sm text-gray-500">No hay reservas creadas.</div>
              ) : (
                reservasGrouped.map((g) => (
                  <div key={g.asignatura} className="bg-gray-50 rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-md font-semibold text-gray-800">{g.asignatura}</div>
                        <div className="text-xs text-gray-500">{g.items.length} {g.items.length === 1 ? 'sesión' : 'sesiones'}</div>
                      </div>
                      <div className="text-sm text-gray-600"> </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {g.items.map((s) => {
                        const id = s._id || s.id;
                        const isEditing = editingId === id;
                        return (
                          <div
                            key={id}
                            className="flex items-center justify-between bg-gray-200 border border-gray-200 rounded-md p-2 shadow-sm"
                          >
                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  className="p-1 border rounded w-24"
                                  value={editValues.horaInicio || ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, horaInicio: e.target.value }))}
                                  placeholder="HH:MM"
                                />
                                <span className="text-sm text-gray-600">-</span>
                                <input
                                  className="p-1 border rounded w-24"
                                  value={editValues.horaFin || ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, horaFin: e.target.value }))}
                                  placeholder="HH:MM"
                                />
                                <select
                                  className="p-1 border rounded"
                                  value={editValues.modalidad || ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, modalidad: e.target.value }))}
                                >
                                  <option value="">Modalidad</option>
                                  <option value="presencial">presencial</option>
                                  <option value="online">online</option>
                                </select>
                                <input
                                  className="p-1 border rounded flex-1"
                                  value={editValues.lugar || ''}
                                  onChange={(e) => setEditValues((v) => ({ ...v, lugar: e.target.value }))}
                                  placeholder="Lugar"
                                />
                              </div>
                            ) : (
                              <div className="text-sm text-gray-800">
                                {s.diaSemana ? `${s.diaSemana} ` : ''}{s.horaInicio}{s.horaFin ? ` - ${s.horaFin}` : ''}
                                {s.modalidad ? <span className="text-xs text-gray-500 ml-2">· {s.modalidad}</span> : null}
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => saveEdit(id)}
                                    className="text-xs px-2 py-1 bg-violet-600 text-white rounded"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-xs px-2 py-1 bg-gray-300 text-gray-800 rounded"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => startEdit(s)}
                                    className="text-xs px-2 py-1 bg-yellow-400 text-white rounded"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => deleteHorario(id)}
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded"
                                  >
                                    Borrar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
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

