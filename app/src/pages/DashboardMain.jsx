import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import Icon from '../components/Icon';
import { fetchApi } from '../config/api';

function DashboardMain({ menu, activeSubsection, user }) {
  const item = menu.find((m) => m.id === activeSubsection) || {};
  const { navigateToSection } = useNavigation();

  const [tutorias, setTutorias] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0);

  // Validar user y obtener uid de manera segura
  const uid = user?._id || user?.id;
  const userRole = user?.rol || 'alumno';

  const fetchDashboardData = useCallback(async () => {
    if (!uid) {
      console.warn('⚠️ No hay usuario disponible');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Obtener tutorías
      let tutoriasData = [];
      try {
        const rol = user.rol === 'profesor' ? 'profesor' : 'estudiante';
        let res = await fetchApi(`/api/tutorias?${rol}=${encodeURIComponent(uid)}`);
        if (!res.ok) {
          res = await fetchApi(`/api/horarios/reservas/${user.rol === 'profesor' ? 'profesor' : 'alumno'}/${encodeURIComponent(uid)}`);
        }
        if (res.ok) {
          const data = await res.json();
          tutoriasData = Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.error('Error cargando tutorías', err);
        tutoriasData = [];
      }

      // Obtener eventos (con userId y userRole para seguridad)
      let eventosData = [];
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const eventosRes = await fetchApi(`/api/eventos?owner=${uid}&userId=${uid}&userRole=${userRole}&start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
        if (eventosRes.ok) {
          eventosData = await eventosRes.json();
        }
      } catch (err) {
        console.error('Error cargando eventos:', err);
        eventosData = [];
      }

      // Obtener reservas de espacios
      let reservasData = [];
      try {
        const reservasRes = await fetchApi('/api/recursos/mis-reservas');
        if (reservasRes.ok) {
          reservasData = await reservasRes.json();
        }
      } catch (err) {
        console.error('Error cargando reservas:', err);
        reservasData = [];
      }

      // Obtener profesores
      let profesoresData = [];
      try {
        const usuariosRes = await fetchApi(`/api/usuarios/profesores`);
        if (usuariosRes.ok) {
          profesoresData = await usuariosRes.json();
        }
      } catch (err) {
        console.error('Error cargando profesores:', err);
        profesoresData = [];
      }

      // Obtener asignaturas del usuario desde el servidor (para que se actualice sin recargar)
      let userAsignaturas = [];
      try {
        const res = await fetchApi(`/api/usuarios/${encodeURIComponent(uid)}`);
        if (res.ok) {
          const userData = await res.json();
          userAsignaturas = userData.asignaturasCursadas || [];
        }
      } catch (error) {
        console.error('Error al obtener asignaturas:', error);
        userAsignaturas = user?.asignaturasCursadas || [];
      }

      setTutorias(tutoriasData || []);
      setEventos(eventosData || []);
      setReservas(reservasData || []);
      setProfesores(profesoresData || []);
      setAsignaturas(userAsignaturas);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }, [uid, userRole, user]); // Dependencias de useCallback

  useEffect(() => {
    if (uid) {
      fetchDashboardData();
    }
  }, [uid, fetchDashboardData]); // Dependencias correctas

  // Usar useMemo para evitar recálculos innecesarios
  const proximasTutorias = useMemo(() => {
    const now = new Date();
    return tutorias
      .filter(t => new Date(t.fechaInicio) > now)
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
      .slice(0, 3);
  }, [tutorias]);

  const proximosEventos = useMemo(() => {
    const now = new Date();
    return eventos
      .filter(e => new Date(e.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 3);
  }, [eventos]);

  const tutoriasEstaSemana = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (selectedWeek * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return tutorias.filter(t => {
      const fecha = new Date(t.fechaInicio);
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });
  }, [tutorias, selectedWeek]);

  const actividadSemanal = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (selectedWeek * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Filtrar eventos de la semana
    const eventosEstaSemana = eventos.filter(e => {
      const fecha = new Date(e.start);
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });

    // Filtrar reservas de la semana
    const reservasEstaSemana = reservas.filter(r => {
      const fecha = new Date(r.fechaReserva);
      return fecha >= startOfWeek && fecha <= endOfWeek;
    });

    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    return days.map((day, index) => {
      // Contar tutorías
      const tutoriasCount = tutoriasEstaSemana.filter(t => {
        const fecha = new Date(t.fechaInicio);
        const dayOfWeek = (fecha.getDay() + 6) % 7;
        return dayOfWeek === index;
      }).length;

      // Contar eventos
      const eventosCount = eventosEstaSemana.filter(e => {
        const fecha = new Date(e.start);
        const dayOfWeek = (fecha.getDay() + 6) % 7;
        return dayOfWeek === index;
      }).length;

      // Contar reservas
      const reservasCount = reservasEstaSemana.filter(r => {
        const fecha = new Date(r.fechaReserva);
        const dayOfWeek = (fecha.getDay() + 6) % 7;
        return dayOfWeek === index;
      }).length;

      const count = tutoriasCount + eventosCount + reservasCount;
      return { day, count };
    });
  }, [tutoriasEstaSemana, eventos, reservas, selectedWeek]);

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstadoColor = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      confirmada: 'bg-green-100 text-green-800',
      completada: 'bg-blue-100 text-blue-800',
      cancelada: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoDot = (estado) => {
    const colors = {
      pendiente: 'bg-yellow-500',
      confirmada: 'bg-green-500',
      completada: 'bg-blue-500',
      cancelada: 'bg-red-500'
    };
    return colors[estado] || 'bg-gray-500';
  };

  const currentWeekLabel = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (selectedWeek * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `Semana ${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
  }, [selectedWeek]);

  const personLabel = (p) => {
    if (!p) return 'Sin asignar';
    if (typeof p === 'object') return p.name || p.email || 'Usuario';
    return p;
  };

  if (loading) {
    return (
      <div className="rounded-lg p-8 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...actividadSemanal.map(a => a.count), 1);

  return (
    <div className="space-y-6">
      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asignaturas */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {user.rol === 'profesor' ? 'Asignaturas Impartidas' : 'Asignaturas Cursadas'}
              </h2>
              <span className="text-sm text-gray-500">2025-26</span>
            </div>
            {asignaturas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {asignaturas.slice(0, 6).map((asignatura, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border-2 border-transparent rounded-lg hover:border-[#7024BB] cursor-pointer transition-all">
                    <span className="text-sm font-medium text-gray-800 truncate">{asignatura}</span>
                    <Icon name="book" className="w-4 h-4 text-[#7024BB] flex-shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="book" className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {user.rol === 'profesor' 
                    ? 'No has añadido asignaturas que impartes'
                    : 'No has añadido asignaturas cursadas'}
                </p>
                <p className="text-xs text-gray-400 mt-1">Ve a tu perfil para añadir asignaturas</p>
              </div>
            )}
            {asignaturas.length > 6 && (
              <div className="mt-3 text-center">
                <button 
                  onClick={() => navigateToSection('perfil')}
                  className="text-sm text-[#7024BB] hover:text-[#5c1d99] font-medium"
                >
                  Ver todas las asignaturas ({asignaturas.length})
                </button>
              </div>
            )}
          </div>

          {/* Espacios reservados */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Espacios reservados</h2>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            {reservas.length > 0 ? (
              <div className="space-y-3">
                {reservas.slice(0, 3).map((reserva, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-[#7024BB] transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{reserva.recurso?.nombre || 'Espacio'}</div>
                        <div className="text-xs text-gray-500">{reserva.recurso?.tipo || 'Aula'}</div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoColor(reserva.estado || 'confirmada')}`}>
                        {reserva.estado || 'confirmada'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(reserva.fechaReserva)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTime(reserva.fechaReserva)}</span>
                      </div>
                      <span>{reserva.duracionHoras || 1}h</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Icon name="calendar" className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500 mb-4">No has reservado espacios aún.</p>
                <button 
                  onClick={() => navigateToSection('espacios')}
                  className="bg-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-purple-700"
                >
                  Reservar
                </button>
              </div>
            )}
          </div>

          {/* Historial de tutorías */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Historial de tutorías</h2>
                <p className="text-sm text-gray-500">Mes de {new Date().toLocaleDateString('es-ES', { month: 'long' })}</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Icon name="search" className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Icon name="filter" className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              {tutorias.slice(0, 4).map((tutoria, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border-2 border-transparent hover:border-[#7024BB] transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 mb-1">{tutoria.tema || 'Tutoría'}</div>
                      <div className="text-xs text-gray-500">
                        {user.rol === 'profesor' 
                          ? `Con ${personLabel(tutoria.estudiante)}`
                          : `Profesor: ${personLabel(tutoria.profesor)}`}
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getEstadoColor(tutoria.estado)}`}>
                      {tutoria.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(tutoria.fechaInicio)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(tutoria.fechaInicio)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="capitalize">{tutoria.modalidad || tutoria.lugar || 'Online'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Actividad semanal */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Actividad</h2>
                <p className="text-sm text-gray-500">{currentWeekLabel}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelectedWeek(selectedWeek - 1)}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                >
                  ←
                </button>
                <button
                  onClick={() => setSelectedWeek(selectedWeek + 1)}
                  className="px-3 py-1 text-sm border rounded-lg hover:bg-gray-50"
                >
                  →
                </button>
              </div>
            </div>
            
            {/* Gráfico de barras */}
            <div className="flex items-end justify-between gap-0 h-32 mb-2">
              {actividadSemanal.map((item, idx) => {
                const height = (item.count / maxCount) * 100;
                const isToday = idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative">
                    <div className="w-full flex items-end justify-center h-24 px-1">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday ? 'bg-[#7024BB]' : 'bg-gray-300 hover:bg-[#7024BB]'
                        }`}
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                      ></div>
                    </div>
                    {/* Línea separadora */}
                    {idx < actividadSemanal.length - 1 && (
                      <div className="absolute right-0 bottom-0 h-24 w-px bg-gray-200"></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between">
              {actividadSemanal.map((item, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className={`text-xs font-medium ${
                    idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0 
                      ? 'text-[#7024BB]' 
                      : 'text-gray-500'
                  }`}>
                    {item.day}
                  </div>
                  {idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0 && (
                    <div className="w-1.5 h-1.5 bg-[#7024BB] rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Próximos eventos */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Próximos eventos</h2>
              <span className="text-sm text-gray-500">2025-26</span>
            </div>
            <div className="space-y-3">
              {proximosEventos.length > 0 ? (
                proximosEventos.map((evento, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-3 rounded-xl border-2 border-transparent transition-all cursor-pointer"
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = evento.color || '#7024BB'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div className="flex items-start gap-2.5">
                      <div 
                        className="w-1 h-12 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: evento.color || '#7024BB' }}
                      ></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 mb-1">{evento.title}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{formatDate(evento.start)}</span>
                          </div>
                          {evento.location && (
                            <>
                              <span>•</span>
                              <div className="flex items-center gap-1 truncate">
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                <span className="truncate text-xs">{evento.location}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>

          {/* Guías Docentes */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Guías Docentes</h2>
              <p className="text-sm text-gray-500">Curso 2025-26</p>
            </div>
            {asignaturas.length > 0 ? (
              <div className="space-y-2">
                {asignaturas.slice(0, 5).map((asignatura, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center gap-3 p-2 bg-white border-2 border-transparent rounded-lg hover:border-[#7024BB] cursor-pointer transition-all group"
                  >
                    <Icon name="file-text" className="w-4 h-4 text-gray-400 group-hover:text-[#7024BB] transition-colors" />
                    <span className="text-sm text-gray-700 truncate flex-1">{asignatura}</span>
                    <Icon name="external-link" className="w-3 h-3 text-gray-300 group-hover:text-[#7024BB] transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Icon name="file-text" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay guías disponibles</p>
                <p className="text-xs text-gray-400 mt-1">Añade asignaturas en tu perfil</p>
              </div>
            )}
          </div>

          {/* Contacto */}
          <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: '#fafbfc' }}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Contacto</h2>
              <p className="text-sm text-gray-500">
                {profesores.length} profesores disponibles
              </p>
            </div>
            <div className="space-y-3">
              {profesores.slice(0, 4).map((profesor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  {profesor?.avatarUrl ? (
                    <img 
                      src={profesor.avatarUrl} 
                      alt={profesor?.name || 'Profesor'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#7024BB] flex items-center justify-center text-white font-semibold">
                      {(profesor?.name || 'P')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{profesor?.name || 'Profesor'}</div>
                    <div className="text-xs text-gray-500">{profesor?.email || 'email@ull.edu.es'}</div>
                  </div>
                  <a 
                    href={`mailto:${profesor?.email || ''}`}
                    className="hover:opacity-70 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Icon name="mail" className="w-5 h-5 text-red-500" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardMain;
