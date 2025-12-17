import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import { fetchApi } from '../config/api';

function Calendario({ user }) {
  const { navigateToSection } = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' o 'day'
  const [eventos, setEventos] = useState([]);
  const [tutorias, setTutorias] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    location: '',
    start: '',
    end: '',
    color: '#3B82F6',
    visibility: 'private'
  });

  // Obtener uid del usuario recibido por props o localStorage como fallback
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');
  const uid = currentUser._id || currentUser.id;

  const fetchCalendarData = useCallback(async () => {
    if (!uid) {
      console.warn('⚠️ No hay usuario disponible, esperando...');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let startDate, endDate;

      if (viewMode === 'month') {
        // Para vista mensual, obtener el mes completo
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        startDate = firstDay;
        endDate = lastDay;
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Para vista diaria
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
      }

      // Obtener eventos (usando el rango ya calculado)
      let eventosData = [];
      try {
        const eventosRes = await fetchApi(`/api/eventos?owner=${uid}&userId=${uid}&userRole=${currentUser.rol}&start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        if (eventosRes.ok) {
          eventosData = await eventosRes.json();
        }
      } catch (err) {
        console.error('Error cargando eventos:', err);
        eventosData = [];
      }

      // Obtener tutorías 
      let tutoriasData = [];
      try {
        const rol = currentUser.rol === 'profesor' ? 'profesor' : 'estudiante';
        let res = await fetchApi(`/api/tutorias?${rol}=${encodeURIComponent(uid)}`);
        if (!res.ok) {
          res = await fetchApi(`/api/horarios/reservas/${currentUser.rol === 'profesor' ? 'profesor' : 'alumno'}/${encodeURIComponent(uid)}`);
        }
        if (res.ok) {
          const data = await res.json();
          tutoriasData = Array.isArray(data) ? data : [];
          console.log('✅ Tutorías cargadas:', tutoriasData.length, tutoriasData);
        } else {
          console.error('❌ Error en respuesta tutorías:', res.status, await res.text());
        }
      } catch (err) {
        console.error('Error cargando tutorías:', err);
        tutoriasData = [];
      }

      // Obtener reservas de espacios
      let reservasData = [];
      try {
        const res = await fetchApi('/api/recursos/mis-reservas');
        if (res.ok) {
          const data = await res.json();
          reservasData = Array.isArray(data) ? data : [];
          console.log('✅ Reservas de espacios cargadas:', reservasData.length, reservasData);
        } else {
          console.error('❌ Error en respuesta reservas:', res.status, await res.text());
        }
      } catch (err) {
        console.error('❌ Error cargando reservas de espacios:', err);
        reservasData = [];
      }

      setEventos(eventosData);
      
      // Filtrar tutorías por rango de fechas
      const tutoriasFiltradas = tutoriasData.filter(t => {
        const fecha = new Date(t.fechaInicio);
        const enRango = fecha >= startDate && fecha <= endDate;
        if (!enRango) {
          console.log('📅 Tutoría fuera de rango:', t.tema, formatDate(fecha), 'vs', formatDate(startDate), '-', formatDate(endDate));
        }
        return enRango;
      });
      
      console.log(`📊 Tutorías en rango (${formatDate(startDate)} - ${formatDate(endDate)}):`, tutoriasFiltradas.length, 'de', tutoriasData.length);
      setTutorias(tutoriasFiltradas);

      // Filtrar reservas por rango de fechas
      const reservasFiltradas = reservasData.filter(r => {
        if (r.estado === 'cancelada') return false; // Excluir canceladas
        const fecha = new Date(r.fechaReserva);
        return fecha >= startDate && fecha <= endDate;
      });
      
      console.log(`📊 Reservas en rango (${formatDate(startDate)} - ${formatDate(endDate)}):`, reservasFiltradas.length, 'de', reservasData.length);
      setReservas(reservasFiltradas);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setLoading(false);
    }
  }, [uid, currentDate, viewMode, currentUser.rol]); // Dependencias del useCallback

  useEffect(() => {
    if (uid) {
      fetchCalendarData();
    }
  }, [uid, fetchCalendarData]); // useEffect con dependencias correctas

  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const getDaysOfWeek = () => {
    const start = getStartOfWeek(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const allItems = [
      ...eventos.map(e => {
        const originalTitle = e.title;
        return {
          ...e,
          type: 'evento',
          start: new Date(e.start),
          end: new Date(e.end),
          // Preservar el color original del evento
          color: e.color || '#3B82F6',
          // Si es compartido y tiene owner, mostrar nombre del profesor
          title: e.visibility === 'shared' && e.owner?.name 
            ? `${originalTitle} (${e.owner.name})` 
            : originalTitle
        };
      }),
      ...tutorias.map(t => ({
        ...t,
        type: 'tutoria',
        title: t.tema,
        start: new Date(t.fechaInicio),
        end: new Date(t.fechaFin),
        color: '#7024BB'
      })),
      ...reservas.map(r => {
        const start = new Date(r.fechaReserva);
        const end = new Date(start.getTime() + (r.duracionHoras || 1) * 60 * 60 * 1000);
        return {
          ...r,
          type: 'reserva',
          title: r.recurso?.nombre || 'Espacio',
          start: start,
          end: end,
          color: '#10B981'
        };
      })
    ];

    return allItems.filter(item => {
      const itemStart = new Date(item.start);
      return itemStart >= dayStart && itemStart <= dayEnd;
    }).sort((a, b) => a.start - b.start);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setDate(next.getDate() + 7); // Mover por semana
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'month') {
      prev.setDate(prev.getDate() - 7); // Mover por semana
    } else {
      prev.setDate(prev.getDate() - 1);
    }
    setCurrentDate(prev);
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const startDate = new Date(newEvent.start);
    const endDate = new Date(newEvent.end);

    if (endDate <= startDate) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const res = await fetchApi('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title,
          description: newEvent.description,
          location: newEvent.location,
          start: newEvent.start,
          end: newEvent.end,
          color: newEvent.color,
          visibility: newEvent.visibility || 'private',
          owner: uid
        })
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewEvent({
          title: '',
          description: '',
          location: '',
          start: '',
          end: '',
          color: '#3B82F6'
        });
        await fetchCalendarData(); // Recargar eventos
      } else {
        const error = await res.text();
        alert('Error al crear evento: ' + error);
      }
    } catch (err) {
      console.error('Error creando evento:', err);
      alert('Error al crear evento');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || selectedEvent.type !== 'evento') {
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      const res = await fetchApi(`/api/eventos/${selectedEvent._id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setShowModal(false);
        setShowDeleteConfirm(false);
        setSelectedEvent(null);
        await fetchCalendarData(); // Recargar eventos
      } else {
        const error = await res.text();
        alert('Error al eliminar evento: ' + error);
      }
    } catch (err) {
      console.error('Error eliminando evento:', err);
      alert('Error al eliminar evento');
    }
  };

  const getDisplayText = () => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('es-ES', { 
        month: 'long', 
        year: 'numeric' 
      });
    } else {
      const dayName = currentDate.toLocaleDateString('es-ES', { weekday: 'long' });
      const date = currentDate.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      return { dayName, date };
    }
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 - 21:00

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 shadow-sm">
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow-sm" onClick={() => setShowDatePicker(false)}>
      {/* Header */}
      <div className="px-6 py-4 bg-gray-50 rounded-t-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold" style={{ color: '#7024BB' }}>Eventos y calendario</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Crear evento
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={prevPeriod}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={today}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Hoy
            </button>
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {viewMode === 'month' ? (
                  <span className="text-lg font-semibold text-gray-900 capitalize">{getDisplayText()}</span>
                ) : (
                  <div>
                    <div className="text-sm font-medium text-gray-500 capitalize">{getDisplayText().dayName}</div>
                    <div className="text-lg font-semibold text-gray-900">{getDisplayText().date}</div>
                  </div>
                )}
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border p-4 z-50 min-w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const prev = new Date(currentDate);
                        prev.setMonth(prev.getMonth() - 1);
                        setCurrentDate(prev);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="font-semibold text-sm capitalize">
                      {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = new Date(currentDate);
                        next.setMonth(next.getMonth() + 1);
                        setCurrentDate(next);
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = currentDate.getFullYear();
                      const month = currentDate.getMonth();
                      const firstDay = new Date(year, month, 1);
                      const lastDay = new Date(year, month + 1, 0);
                      const startPadding = (firstDay.getDay() + 6) % 7; // Lunes = 0
                      const days = [];

                      // Días vacíos antes del primer día
                      for (let i = 0; i < startPadding; i++) {
                        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                      }

                      // Días del mes
                      for (let day = 1; day <= lastDay.getDate(); day++) {
                        const date = new Date(year, month, day);
                        const isSelected = currentDate.toDateString() === date.toDateString();
                        const isToday = new Date().toDateString() === date.toDateString();

                        days.push(
                          <button
                            key={day}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentDate(date);
                              setShowDatePicker(false);
                            }}
                            className={`aspect-square flex items-center justify-center text-sm rounded-lg transition-colors ${
                              isSelected
                                ? 'bg-purple-600 text-white font-semibold'
                                : isToday
                                ? 'bg-purple-100 text-purple-700 font-semibold'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }

                      return days;
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                viewMode === 'month' 
                  ? 'text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={viewMode === 'month' ? { backgroundColor: '#7024BB' } : {}}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                viewMode === 'day' 
                  ? 'text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
              style={viewMode === 'day' ? { backgroundColor: '#7024BB' } : {}}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        // Vista Mensual (semana actual)
        <div className="overflow-x-auto bg-gray-50 rounded-b-lg p-4 pt-2">
          <div className="min-w-[800px] bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            {/* Days Header */}
            <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', backgroundColor: '#fafbfc', borderBottom: '1px solid #e5e7eb' }}>
              <div className="p-4 text-xs text-gray-500"></div>
              {getDaysOfWeek().map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`p-4 text-center ${isToday ? 'bg-purple-50' : ''}`}
                  >
                    <div className={`text-xs font-semibold uppercase tracking-wider ${isToday ? 'text-purple-700' : 'text-gray-600'}`}>
                      {formatDate(day).split(',')[0]}
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-purple-700' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)', minHeight: '80px', borderBottom: '1px solid #f3f4f6' }}>
                  <div className="p-2 text-xs text-gray-600 text-right pr-4 font-medium" style={{ backgroundColor: '#fafbfc' }}>
                    {`${hour}:00`}
                  </div>
                  {getDaysOfWeek().map((day, dayIdx) => {
                    const events = getEventsForDay(day).filter(e => {
                      const eventStartHour = e.start.getHours();
                      const eventEndHour = e.end.getHours();
                      const eventEndMinutes = e.end.getMinutes();
                      
                      // Mostrar evento si la hora actual está entre inicio y fin
                      if (eventEndMinutes === 0) {
                        return hour >= eventStartHour && hour < eventEndHour;
                      } else {
                        return hour >= eventStartHour && hour <= eventEndHour;
                      }
                    });

                    return (
                      <div key={dayIdx} className="p-1.5 relative" style={{ borderLeft: '1px solid #f3f4f6' }}>
                        {events.map((event, eventIdx) => {
                          return (
                            <div
                              key={eventIdx}
                              onClick={() => handleEventClick(event)}
                              className="mb-1.5 p-2 rounded-lg text-xs cursor-pointer hover:opacity-90 transition-all duration-200"
                              style={{
                                backgroundColor: event.color || '#3B82F6',
                                color: 'white',
                                minHeight: '50px'
                              }}
                            >
                              <div className="font-medium truncate text-[11px] flex items-center gap-1">
                                {event.type === 'tutoria' && (
                                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                                  </svg>
                                )}
                                {event.type === 'reserva' && (
                                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                                  </svg>
                                )}
                                {event.type === 'evento' && (
                                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                  </svg>
                                )}
                                <span className="truncate">{event.title}</span>
                              </div>
                              <div className="text-[10px] mt-0.5 opacity-80">
                                {formatTime(event.start)}
                              </div>
                              {event.type === 'tutoria' && event.modalidad && (
                                <div className="text-[9px] mt-0.5 opacity-75 capitalize truncate">
                                  {event.modalidad}
                                </div>
                              )}
                              {event.type === 'reserva' && event.recurso?.nombre && (
                                <div className="text-[9px] mt-0.5 opacity-75 truncate">
                                  {event.recurso.nombre}
                                </div>
                              )}
                              {(event.location || event.lugar) && (
                                <div className="text-[9px] mt-0.5 opacity-75 truncate">
                                  {event.location || event.lugar}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Vista Diaria
        <div className="overflow-auto max-h-[calc(100vh-200px)] bg-gray-50 rounded-b-lg p-4 pt-2">
          <div className="min-w-[600px] bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #e5e7eb' }}>
            {/* Header de vista diaria */}
            <div className="px-6 py-4" style={{ backgroundColor: '#fafbfc', borderBottom: '2px solid #e5e7eb' }}>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-1">
                  {currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}
                </div>
                <div className="text-4xl font-bold text-gray-900">
                  {currentDate.getDate()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="relative">
              {hours.map(hour => {
                const events = getEventsForDay(currentDate).filter(e => {
                  const eventStartHour = e.start.getHours();
                  const eventEndHour = e.end.getHours();
                  const eventEndMinutes = e.end.getMinutes();
                  
                  // Mostrar evento si la hora actual está entre inicio y fin
                  // Si termina exactamente en punto (minutos = 0), no incluir esa hora
                  if (eventEndMinutes === 0) {
                    return hour >= eventStartHour && hour < eventEndHour;
                  } else {
                    return hour >= eventStartHour && hour <= eventEndHour;
                  }
                });

                return (
                  <div key={hour} className="flex" style={{ minHeight: '80px', borderBottom: '1px solid #f3f4f6' }}>
                    <div className="w-24 p-2 text-xs text-gray-600 text-right pr-4 font-medium" style={{ borderRight: '1px solid #f3f4f6', backgroundColor: '#fafbfc' }}>
                      {`${hour}:00`}
                    </div>
                    <div className="flex-1 p-2 relative">
                      {events.map((event, eventIdx) => {
                        return (
                          <div
                            key={eventIdx}
                            onClick={() => handleEventClick(event)}
                            className="mb-2 p-2.5 rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200"
                            style={{
                              backgroundColor: event.color || '#3B82F6',
                              color: 'white',
                              minHeight: '60px'
                            }}
                          >
                            <div className="font-medium text-sm mb-1 flex items-center gap-2">
                              {event.type === 'tutoria' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                                </svg>
                              )}
                              {event.type === 'reserva' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
                                </svg>
                              )}
                              {event.type === 'evento' && (
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                                </svg>
                              )}
                              <span>{event.title}</span>
                            </div>
                            <div className="text-xs opacity-80">
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                            {event.type === 'tutoria' && event.modalidad && (
                              <div className="text-xs opacity-75 mt-1 capitalize">
                                {event.modalidad}
                              </div>
                            )}
                            {event.type === 'reserva' && event.recurso?.nombre && (
                              <div className="text-xs opacity-75 mt-1">
                                {event.recurso.nombre}
                              </div>
                            )}
                            {(event.location || event.lugar) && (
                              <div className="text-xs opacity-75 mt-1">
                                {event.location || event.lugar}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {events.length === 0 && (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          Sin eventos
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedEvent.color }}
                ></div>
                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {formatDate(selectedEvent.start)} · {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                </span>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedEvent.location || selectedEvent.lugar}</span>
                </div>
              )}

              {selectedEvent.description && (
                <div className="mt-4">
                  <p className="text-gray-700">{selectedEvent.description || selectedEvent.descripcion}</p>
                </div>
              )}

              {selectedEvent.type === 'tutoria' && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm font-semibold text-purple-900 mb-2">Detalles de la Tutoría</div>
                  <div className="text-sm text-purple-800">
                    <div>Modalidad: {selectedEvent.modalidad}</div>
                    <div>Estado: {selectedEvent.estado}</div>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'reserva' && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-semibold text-green-900 mb-2">Detalles de la Reserva</div>
                  <div className="text-sm text-green-800">
                    <div>Recurso: {selectedEvent.recurso?.nombre || 'N/A'}</div>
                    <div>Tipo: {selectedEvent.recurso?.tipo || 'N/A'}</div>
                    {selectedEvent.recurso?.ubicacion && (
                      <div>Ubicación: {selectedEvent.recurso.ubicacion}</div>
                    )}
                    <div>Duración: {selectedEvent.duracionHoras || 1}h</div>
                  </div>
                </div>
              )}

              {selectedEvent.type === 'evento' && selectedEvent.visibility === 'shared' && selectedEvent.owner?._id !== uid && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-900 mb-2">Evento Compartido</div>
                  <div className="text-sm text-blue-800">
                    <div>Profesor: {selectedEvent.owner?.name || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {/* Solo mostrar botón borrar si es evento propio del usuario */}
              {selectedEvent.type === 'evento' && (selectedEvent.owner === uid || selectedEvent.owner?._id === uid || selectedEvent.owner?._id === uid) && (
                <button
                  onClick={handleDeleteEvent}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Borrar
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear Evento */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="relative w-full max-w-xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#7024BB] to-[#5a1d99] px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Crear evento</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
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
                {/* Título */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#7024BB]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                      </svg>
                      Título
                    </span>
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    placeholder="Ej: Reunión de equipo"
                  />
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Descripción
                    </span>
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all resize-none"
                    placeholder="Detalles del evento..."
                    rows="3"
                  />
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
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
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
                    type="datetime-local"
                    value={newEvent.start}
                    onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all text-sm"
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
                    type="datetime-local"
                    value={newEvent.end}
                    onChange={(e) => setNewEvent({ ...newEvent, end: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all text-sm"
                  />
                </div>

                {/* Color */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      Color
                    </span>
                  </label>
                  <div className="flex gap-2">
                    {['#7024BB', '#60A5FA', '#10B981', '#F59E0B', '#EF4444', '#EC4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewEvent({ ...newEvent, color })}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          newEvent.color === color ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color, ringColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Visibilidad - Solo para profesores */}
                {currentUser.rol === 'profesor' && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Visibilidad
                      </span>
                    </label>
                    <select
                      value={newEvent.visibility || 'private'}
                      onChange={(e) => setNewEvent({ ...newEvent, visibility: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all"
                    >
                      <option value="private">Privado (solo yo)</option>
                      <option value="shared">Compartido (mis alumnos pueden verlo)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateEvent}
                className="flex-1 px-6 py-3 text-white rounded-xl font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#7024BB' }}
              >
                Guardar horario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmación Borrar Evento */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Eliminar evento</h3>
                <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar el evento "{selectedEvent?.title}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendario;
