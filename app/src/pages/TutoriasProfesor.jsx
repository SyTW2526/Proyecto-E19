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

  // mostrar solo el historial correspondiente al profesor actual
  const visibleHistorial = useMemo(() => {
    const uid = (user && (user._id || user.id)) || (typeof window !== 'undefined' && localStorage.getItem('userId')) || null;
    if (!uid) return parsedHistorial;
    return (parsedHistorial || []).filter((s) => {
      const prof = s.profesor || s.professor || (s.profesorId || s.professorId) || null;
      // comparar como string con ObjectId posibles
      if (!prof) return false;
      return (prof.toString ? prof.toString() : String(prof)) === String(uid);
    });
  }, [parsedHistorial, user]);

  const sessionsByDay = useMemo(() => {
    const map = {};
    daysOfWeek.forEach((d) => {
      const key = d.toDateString();
      map[key] = [];
    });
    (visibleHistorial || []).forEach((s) => {
      const key = (s.date || s.startDate || new Date()).toDateString();
      if (map[key]) map[key].push(s);
    });
    // ordenar por hora dentro de cada día
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => a.date - b.date);
    });
    return map;
  }, [daysOfWeek, visibleHistorial]);

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
    <div className="mt-4">
      {/* Controles de semana (solo en historial) */}
      {tab === 'historial' && (
        <div className="flex items-center gap-2 mb-4">
          <button onClick={prevWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">«</button>
          <div className="text-sm text-gray-600">
            {daysOfWeek && daysOfWeek[0] ? daysOfWeek[0].toLocaleDateString() : ''} - {daysOfWeek && daysOfWeek[Math.min(4, daysOfWeek.length - 1)] ? daysOfWeek[Math.min(4, daysOfWeek.length - 1)].toLocaleDateString() : ''}
          </div>
          <button onClick={nextWeek} className="px-3 py-1 bg-violet-50 text-violet-600 rounded border border-violet-100">»</button>
        </div>
      )}

      {/* Botón "Nuevo horario" alineado a la derecha para la pestaña reservar */}
      {tab === 'reservar' && (
        <div className="flex justify-end mb-4">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#7024BB] hover:bg-[#5a1d99] text-white rounded-xl font-medium transition-all flex items-center gap-2"
            aria-label="Nuevo horario"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo horario
          </button>
        </div>
      )}

        {/* Gestión de tutorías (solicitudes pendientes) */}
        {tab === 'profesores' && (
          <div>
            {loadingPending ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7024BB]"></div>
              </div>
            ) : visiblePendingRequests.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-500 text-lg">No hay solicitudes pendientes</p>
                <p className="text-gray-400 text-sm mt-2">Las solicitudes de tutoría de tus estudiantes aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {visiblePendingRequests.map((r) => {
                  const fechaInicio = r.fechaInicio ? new Date(r.fechaInicio) : null;
                  const estudianteNombre = (r.estudiante && (r.estudiante.name || r.estudiante.username)) || r.alumno || 'Estudiante';
                  
                  return (
                    <div key={r._id || r.id} className="p-5 rounded-xl bg-gray-50 hover:ring-2 hover:ring-yellow-400 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Info principal */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 text-lg">{r.tema || r.title || 'Tutoría solicitada'}</h4>
                            <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                              Pendiente
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                            <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{estudianteNombre}</span>
                          </div>
                          
                          {fechaInicio && (
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button 
                            onClick={() => acceptRequest(r._id || r.id)} 
                            className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Aceptar
                          </button>
                          <button 
                            onClick={() => reprogramRequest(r._id || r.id)} 
                            className="px-4 py-2 text-sm font-medium bg-white hover:bg-yellow-50 text-yellow-600 border border-yellow-400 rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Reprogramar
                          </button>
                          <button 
                            onClick={() => cancelRequest(r._id || r.id)} 
                            className="px-4 py-2 text-sm font-medium bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-lg transition-all flex items-center justify-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Mis tutorías (solo CONFIRMADAS del profesor actual) */}
        {tab === 'mis-tutorias' && (
          <div>
            {loadingMySessions ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7024BB]"></div>
              </div>
            ) : visibleMySessions.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No hay tutorías confirmadas</p>
                <p className="text-gray-400 text-sm mt-2">Tus tutorías confirmadas aparecerán aquí</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleMySessions.map((s) => {
                  const fechaInicio = s.fechaInicio ? new Date(s.fechaInicio) : null;
                  const estudianteNombre = s.alumno || (s.estudiante && (s.estudiante.name || s.estudiante.username)) || 'Estudiante';
                  const tema = s.tema || s.title || 'Tutoría';
                  const isPast = fechaInicio && fechaInicio < new Date();
                  
                  return (
                    <div key={s._id || s.id} className="p-5 rounded-xl bg-gray-50 hover:ring-2 hover:ring-[#7024BB] transition-all cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{tema}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                            <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{estudianteNombre}</span>
                          </div>
                        </div>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                          isPast
                            ? 'bg-gray-50 text-gray-600 border border-gray-200'
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {isPast ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Pasada
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Confirmada
                            </>
                          )}
                        </span>
                      </div>

                      {fechaInicio && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{fechaInicio.toLocaleDateString('es-ES', { 
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
                            <span>{fechaInicio.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          {s.modalidad && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.modalidad === 'online' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' : 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'} />
                              </svg>
                              <span className="capitalize">{s.modalidad}</span>
                            </div>
                          )}
                          {s.lugar && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{s.lugar}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                            // normalizar estado y elegir colores
                            const estado = (s.estado || s.status || '').toString().toLowerCase();
                            const isConfirmada = estado === 'confirmada' || estado === 'confirmed' || estado === 'confirmado';
                            const isPendiente = estado === 'pendiente' || estado === 'pending';
                            // gradiente para el fondo del bloque (verde = confirmada, amarillo = pendiente, violeta = por defecto)
                            const gradientClass = isConfirmada
                              ? 'from-green-600 to-green-400'
                              : isPendiente
                              ? 'from-yellow-600 to-violet-400'
                              : 'from-violet-800 to-yellow-600';
                            const leftBarClass = isConfirmada ? 'bg-green-300' : isPendiente ? 'bg-yellow-300' : 'bg-white/30';

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
                                  <div className={`w-1 ${leftBarClass} rounded-l-md`} />
                                  <div className={`flex-1 bg-gradient-to-r ${gradientClass} text-white p-2 rounded-r-lg`}>
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

        {/* Gestión de horarios */}
        {tab === 'reservar' && sesiones && (
          <div className="space-y-4">
            {reservasGrouped.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No hay horarios creados</p>
                <p className="text-gray-400 text-sm mt-2">Haz clic en "Nuevo horario" para crear tu primer horario de tutoría</p>
              </div>
            ) : (
              reservasGrouped.map((g) => (
                <div key={g.asignatura} className="p-6 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{g.asignatura}</div>
                      <div className="text-sm text-gray-500 mt-1">{g.items.length} {g.items.length === 1 ? 'horario disponible' : 'horarios disponibles'}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {g.items.map((s) => {
                      const id = s._id || s.id;
                      const isEditing = editingId === id;
                      return (
                        <div
                          key={id}
                          className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-xl p-4 hover:ring-2 hover:ring-[#7024BB] transition-all"
                        >
                          {isEditing ? (
                            <div className="flex-1 flex flex-wrap items-center gap-3">
                              <input
                                className="px-3 py-2 border border-gray-300 rounded-lg w-28 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent"
                                value={editValues.horaInicio || ''}
                                onChange={(e) => setEditValues((v) => ({ ...v, horaInicio: e.target.value }))}
                                placeholder="HH:MM"
                              />
                              <span className="text-sm text-gray-600 font-medium">-</span>
                              <input
                                className="px-3 py-2 border border-gray-300 rounded-lg w-28 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent"
                                value={editValues.horaFin || ''}
                                onChange={(e) => setEditValues((v) => ({ ...v, horaFin: e.target.value }))}
                                placeholder="HH:MM"
                              />
                              <select
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7024BB] focus:border-transparent"
                                value={editValues.modalidad || ''}
                                onChange={(e) => setEditValues((v) => ({ ...v, modalidad: e.target.value }))}
                              >
                                <option value="">Modalidad</option>
                                <option value="presencial">Presencial</option>
                                <option value="online">Online</option>
                              </select>
                              <input
                                className="px-3 py-2 border border-gray-300 rounded-lg flex-1 min-w-[150px] focus:ring-2 focus:ring-[#7024BB] focus:border-transparent"
                                value={editValues.lugar || ''}
                                onChange={(e) => setEditValues((v) => ({ ...v, lugar: e.target.value }))}
                                placeholder="Lugar"
                              />
                            </div>
                          ) : (
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900">
                                {s.diaSemana ? `${s.diaSemana.charAt(0).toUpperCase() + s.diaSemana.slice(1)} ` : ''}{s.horaInicio}{s.horaFin ? ` - ${s.horaFin}` : ''}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                                {s.modalidad && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.modalidad === 'online' ? 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' : 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'} />
                                    </svg>
                                    <span className="capitalize">{s.modalidad}</span>
                                  </span>
                                )}
                                {s.lugar && (
                                  <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {s.lugar}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => saveEdit(id)}
                                  className="px-3 py-2 text-sm font-medium bg-[#7024BB] hover:bg-[#5a1d99] text-white rounded-lg transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Guardar
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-3 py-2 text-sm font-medium bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-lg transition-all whitespace-nowrap"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(s)}
                                  className="px-3 py-2 text-sm font-medium bg-white hover:bg-[#f5f0ff] text-[#7024BB] border border-[#7024BB] rounded-lg transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Editar
                                </button>
                                <button
                                  onClick={() => deleteHorario(id)}
                                  className="px-3 py-2 text-sm font-medium bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-lg transition-all flex items-center justify-center gap-1 whitespace-nowrap"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
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
        )}

        {/* Modal de creación (local) */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeCreateModal}>
            <div className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gradient-to-r from-[#7024BB] to-[#5a1d99] px-5 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Crear horario de tutoría</h3>
                  </div>
                  <button 
                    onClick={closeCreateModal} 
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Asignatura */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Asignatura
                      </span>
                    </label>
                    <input
                      value={newReserva.asignatura}
                      onChange={(e) => setNewReserva({ ...newReserva, asignatura: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                      placeholder="Ej: Sistemas y Tecnologías Web"
                    />
                  </div>

                  {/* Día de la semana */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Día de la semana
                      </span>
                    </label>
                    <select
                      value={newReserva.diaSemana}
                      onChange={(e) => setNewReserva({ ...newReserva, diaSemana: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    >
                      <option value="lunes">Lunes</option>
                      <option value="martes">Martes</option>
                      <option value="miercoles">Miércoles</option>
                      <option value="jueves">Jueves</option>
                      <option value="viernes">Viernes</option>
                      <option value="sabado">Sábado</option>
                      <option value="domingo">Domingo</option>
                    </select>
                  </div>

                  {/* Modalidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Modalidad
                      </span>
                    </label>
                    <select
                      value={newReserva.modalidad}
                      onChange={(e) => setNewReserva({ ...newReserva, modalidad: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    >
                      <option value="presencial">Presencial</option>
                      <option value="online">Online</option>
                    </select>
                  </div>

                  {/* Lugar */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Lugar
                      </span>
                    </label>
                    <input
                      value={newReserva.lugar}
                      onChange={(e) => setNewReserva({ ...newReserva, lugar: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                      placeholder="Ej: Despacho 2.5 / Sala de reuniones"
                    />
                  </div>

                  {/* Hora inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hora inicio
                      </span>
                    </label>
                    <input
                      type="time"
                      value={newReserva.horaInicio || '09:00'}
                      onChange={(e) => setNewReserva({ ...newReserva, horaInicio: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    />
                  </div>

                  {/* Hora fin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Hora fin
                      </span>
                    </label>
                    <input
                      type="time"
                      value={newReserva.horaFin || '10:00'}
                      onChange={(e) => setNewReserva({ ...newReserva, horaFin: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={closeCreateModal} 
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveNewReserva} 
                    className="px-6 py-2.5 text-sm font-medium text-white bg-[#7024BB] hover:bg-[#5a1d99] rounded-xl transition-all flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar horario
                  </button>
                </div>
              </div>
            </div>
          </div>
         )}
    </div>
  );
}

export default TutoriasProfesor;

