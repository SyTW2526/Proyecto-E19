import React, { useState, useEffect, useMemo } from 'react';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const uid = user && (user._id || user.id);
      if (!uid) {
        setLoading(false);
        return;
      }

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

      // Obtener eventos
      let eventosData = [];
      try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const eventosRes = await fetchApi(`/api/eventos?owner=${uid}&start=${startOfMonth.toISOString()}&end=${endOfMonth.toISOString()}`);
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
        const usuariosRes = await fetchApi(`/api/usuarios`);
        if (usuariosRes.ok) {
          const usuarios = await usuariosRes.json();
          profesoresData = usuarios.filter(u => u.rol === 'profesor');
        }
      } catch (err) {
        console.error('Error cargando profesores:', err);
        profesoresData = [];
      }

      // Obtener asignaturas del usuario
      const userAsignaturas = user?.asignaturasCursadas || [];

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
  };

  const getProximasTutorias = () => {
    const now = new Date();
    return tutorias
      .filter(t => new Date(t.fechaInicio) > now)
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
      .slice(0, 3);
  };

  const getProximosEventos = () => {
    const now = new Date();
    return eventos
      .filter(e => new Date(e.start) > now)
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 3);
  };

  const getTutoriasEstaSemana = () => {
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
  };

  const getActividadSemanal = () => {
    const weekTutorias = getTutoriasEstaSemana();
    const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const activity = days.map((day, index) => {
      const count = weekTutorias.filter(t => {
        const fecha = new Date(t.fechaInicio);
        const dayOfWeek = (fecha.getDay() + 6) % 7;
        return dayOfWeek === index;
      }).length;
      return { day, count };
    });
    return activity;
  };

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

  const getCurrentWeekLabel = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (selectedWeek * 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return `Semana ${startOfWeek.getDate()}-${endOfWeek.getDate()} ${startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
  };

  const personLabel = (p) => {
    if (!p) return 'Sin asignar';
    if (typeof p === 'object') return p.name || p.email || 'Usuario';
    return p;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  const actividadSemanal = getActividadSemanal();
  const maxCount = Math.max(...actividadSemanal.map(a => a.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Asignaturas */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {user.rol === 'profesor' ? 'Asignaturas Impartidas' : 'Asignaturas Cursadas'}
              </h2>
              <span className="text-sm text-gray-500">2025-26</span>
            </div>
            {asignaturas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {asignaturas.slice(0, 6).map((asignatura, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className="text-sm font-medium text-gray-800 truncate">{asignatura}</span>
                    <Icon name="book" className="w-4 h-4 text-violet-600 flex-shrink-0 ml-2" />
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
                  onClick={() => window.location.href = '/perfil'}
                  className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                >
                  Ver todas las asignaturas ({asignaturas.length})
                </button>
              </div>
            )}
          </div>

          {/* Próximos Eventos */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Próximos eventos</h2>
              <span className="text-sm text-gray-500">2025-26</span>
            </div>
            <div className="space-y-3">
              {getProximosEventos().length > 0 ? (
                getProximosEventos().map((evento, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className={`w-2 h-2 rounded-full ${evento.color ? '' : 'bg-purple-500'}`} style={{ backgroundColor: evento.color }}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{evento.title}</div>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(evento.start)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No hay eventos próximos</p>
              )}
            </div>
          </div>

          {/* Espacios reservados */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Espacios reservados</h2>
              <span className="text-sm text-gray-500">Este mes</span>
            </div>
            {reservas.length > 0 ? (
              <div className="space-y-3">
                {reservas.slice(0, 3).map((reserva, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{reserva.recurso?.nombre || 'Espacio'}</div>
                      <div className="text-xs text-gray-500">{formatDate(reserva.fechaReserva)}</div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(reserva.fechaReserva)}</span>
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
          <div className="bg-white rounded-lg p-6 shadow-sm">
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
                <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Icon name="user" className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {user.rol === 'profesor' 
                        ? personLabel(tutoria.estudiante)
                        : personLabel(tutoria.profesor)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(tutoria.fechaInicio)} {formatTime(tutoria.fechaInicio)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tutoria.lugar || 'Online'}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(tutoria.estado)}`}>
                      {tutoria.estado}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${getEstadoDot(tutoria.estado)}`}></div>
                  </div>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <Icon name="more-vertical" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* Actividad semanal */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Actividad</h2>
                <p className="text-sm text-gray-500">{getCurrentWeekLabel()}</p>
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
            <div className="flex items-end justify-between gap-2 h-32 mb-2">
              {actividadSemanal.map((item, idx) => {
                const height = (item.count / maxCount) * 100;
                const isToday = idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center h-24">
                      <div
                        className={`w-full rounded-t transition-all ${
                          isToday ? 'bg-purple-600' : 'bg-gray-300'
                        }`}
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? '4px' : '0' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between">
              {actividadSemanal.map((item, idx) => (
                <div key={idx} className="flex-1 text-center">
                  <div className={`text-xs font-medium ${
                    idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0 
                      ? 'text-purple-600' 
                      : 'text-gray-500'
                  }`}>
                    {item.day}
                  </div>
                  {idx === ((new Date().getDay() + 6) % 7) && selectedWeek === 0 && (
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mx-auto mt-1"></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Horario Clase */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Horario Clase</h2>
              <span className="text-sm text-gray-500">
                Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="space-y-3">
              {getTutoriasEstaSemana()
                .filter(t => {
                  const fecha = new Date(t.fechaInicio);
                  return fecha.toDateString() === new Date().toDateString();
                })
                .slice(0, 3)
                .map((tutoria, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{tutoria.tema}</span>
                      <span className="text-xs text-gray-500">{tutoria.modalidad}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{tutoria.lugar || 'Online'}</span>
                      <span>{formatTime(tutoria.fechaInicio)} - {formatTime(tutoria.fechaFin)}</span>
                    </div>
                    {idx < 2 && <div className="border-b pt-2"></div>}
                  </div>
                ))}
              {getTutoriasEstaSemana().filter(t => new Date(t.fechaInicio).toDateString() === new Date().toDateString()).length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay clases hoy</p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              {[0, 1, 2, 3, 4].map((dot) => (
                <div
                  key={dot}
                  className={`w-2 h-2 rounded-full ${dot === 0 ? 'bg-purple-600' : 'bg-gray-300'}`}
                ></div>
              ))}
            </div>
          </div>

          {/* Guías Docentes */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Guías Docentes</h2>
              <p className="text-sm text-gray-500">25-26</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="file-text" className="w-4 h-4 text-gray-400" />
                <span>13926652 - Sistemas y Tecnologías...</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="file-text" className="w-4 h-4 text-gray-400" />
                <span>13926904 - Robótica Computacional</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="file-text" className="w-4 h-4 text-gray-400" />
                <span>13926902 - Visión por Computador</span>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Contacto</h2>
              <p className="text-sm text-gray-500">
                {profesores.length} profesores disponibles
              </p>
            </div>
            <div className="space-y-3">
              {profesores.slice(0, 4).map((profesor, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                    {(profesor?.name || 'P')[0].toUpperCase()}
                  </div>
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
