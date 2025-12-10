import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Calendario() {
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

  // Obtener usuario actual del localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, viewMode]);

  const fetchCalendarData = async () => {
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

      // Obtener eventos
      const eventosRes = await axios.get(`http://localhost:4000/api/eventos`, {
        params: {
          owner: user._id,
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      });

      // Obtener tutorías con fallback
      let tutoriasRes;
      if (user.rol === 'profesor') {
        try {
          tutoriasRes = await axios.get(`http://localhost:4000/api/tutorias`, {
            params: {
              profesor: user._id,
              inicio: startDate.toISOString(),
              fin: endDate.toISOString()
            }
          });
        } catch (error) {
          // Fallback a endpoint de horarios
          tutoriasRes = await axios.get(`http://localhost:4000/api/horarios/reservas/profesor/${user._id}`);
        }
      } else {
        try {
          tutoriasRes = await axios.get(`http://localhost:4000/api/tutorias`, {
            params: {
              estudiante: user._id,
              inicio: startDate.toISOString(),
              fin: endDate.toISOString()
            }
          });
        } catch (error) {
          // Fallback a endpoint reservas por alumno
          tutoriasRes = await axios.get(`http://localhost:4000/api/horarios/reservas/alumno/${user._id}`);
        }
      }

      setEventos(eventosRes.data);
      
      // Filtrar tutorías por rango de fechas si el fallback no filtró
      const tutoriasFiltradas = tutoriasRes.data.filter(t => {
        const fecha = new Date(t.fechaInicio);
        return fecha >= startDate && fecha <= endDate;
      });
      
      setTutorias(tutoriasFiltradas);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setLoading(false);
    }
  };

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
      ...eventos.map(e => ({
        ...e,
        type: 'evento',
        start: new Date(e.start),
        end: new Date(e.end),
        color: e.color || '#3B82F6'
      })),
      ...tutorias.map(t => ({
        ...t,
        type: 'tutoria',
        title: t.tema,
        start: new Date(t.fechaInicio),
        end: new Date(t.fechaFin),
        color: '#8B5CF6'
      }))
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
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (viewMode === 'month') {
      prev.setMonth(prev.getMonth() - 1);
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
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm" onClick={() => setShowDatePicker(false)}>
      {/* Header */}
      <div className="border-b px-6 py-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-purple-700">Eventos y calendario</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Crear evento
          </button>
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
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'month' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'day' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Día
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        // Vista Mensual (semana actual)
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-8 border-b bg-gray-50">
              <div className="p-2 text-xs text-gray-500 w-12"></div>
              {getDaysOfWeek().map((day, idx) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div
                    key={idx}
                    className={`p-3 text-center ${isToday ? 'bg-purple-50' : ''}`}
                  >
                    <div className={`text-xs font-medium ${isToday ? 'text-purple-700' : 'text-gray-900'}`}>
                      {formatDate(day).split(',')[0]}
                    </div>
                    <div className={`text-sm mt-1 ${isToday ? 'text-purple-700 font-bold' : 'text-gray-600'}`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {hours.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b" style={{ minHeight: '80px' }}>
                  <div className="p-1 text-xs text-gray-500 text-right pr-2 w-12">
                    {`${hour}:00`}
                  </div>
                  {getDaysOfWeek().map((day, dayIdx) => {
                    const events = getEventsForDay(day).filter(e => {
                      const eventHour = e.start.getHours();
                      return eventHour === hour;
                    });

                    return (
                      <div key={dayIdx} className="border-l p-1.5 relative">
                        {events.map((event, eventIdx) => {
                          const duration = (event.end - event.start) / (1000 * 60);
                          const height = Math.max((duration / 60) * 80, 50);

                          return (
                            <div
                              key={eventIdx}
                              onClick={() => handleEventClick(event)}
                              className="mb-1 p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity"
                              style={{
                                backgroundColor: event.color,
                                color: 'white',
                                minHeight: `${height}px`
                              }}
                            >
                              <div className="font-semibold truncate">{event.title}</div>
                              <div className="text-xs opacity-90">
                                {formatTime(event.start)} - {formatTime(event.end)}
                              </div>
                              {event.type === 'tutoria' && (
                                <div className="text-xs mt-1 opacity-90 flex items-center gap-1">
                                  <span>📚</span>
                                  <span>{event.modalidad || 'Tutoría'}</span>
                                </div>
                              )}
                              {(event.location || event.lugar) && (
                                <div className="text-xs opacity-90 truncate">
                                  📍 {event.location || event.lugar}
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
        <div className="overflow-auto max-h-[calc(100vh-200px)]">
          <div className="min-w-[600px]">
            <div className="relative">
              {hours.map(hour => {
                const events = getEventsForDay(currentDate).filter(e => {
                  const eventHour = e.start.getHours();
                  return eventHour === hour;
                });

                return (
                  <div key={hour} className="flex border-b" style={{ minHeight: '80px' }}>
                    <div className="w-20 p-2 text-xs text-gray-500 text-right pr-4 border-r bg-gray-50">
                      {`${hour}:00`}
                    </div>
                    <div className="flex-1 p-2 relative">
                      {events.map((event, eventIdx) => {
                        const duration = (event.end - event.start) / (1000 * 60);
                        const height = Math.max((duration / 60) * 80, 50);

                        return (
                          <div
                            key={eventIdx}
                            onClick={() => handleEventClick(event)}
                            className="mb-2 p-3 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                            style={{
                              backgroundColor: event.color,
                              color: 'white',
                              minHeight: `${height}px`
                            }}
                          >
                            <div className="font-semibold text-sm mb-1">{event.title}</div>
                            <div className="text-xs opacity-90 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </div>
                            {event.type === 'tutoria' && (
                              <div className="text-xs mt-1 opacity-90 flex items-center gap-1">
                                <span>📚</span>
                                <span>{event.modalidad || 'Tutoría'}</span>
                              </div>
                            )}
                            {(event.location || event.lugar) && (
                              <div className="text-xs mt-1 opacity-90 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span>{event.location || event.lugar}</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
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
            </div>

            <div className="mt-6 flex gap-3">
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
    </div>
  );
}

export default Calendario;
