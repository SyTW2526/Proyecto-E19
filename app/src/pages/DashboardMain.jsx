import React, { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';
import axios from 'axios';
import Icon from '../components/Icon';

function DashboardMain({ menu, activeSubsection }) {
  const item = menu.find((m) => m.id === activeSubsection) || {};
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { navigateToSection } = useNavigation();
  
  const [tutorias, setTutorias] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = semana actual

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Obtener tutorías
      let tutoriasRes;
      if (user.rol === 'profesor') {
        try {
          tutoriasRes = await axios.get(`http://localhost:4000/api/tutorias`, {
            params: { profesor: user._id }
          });
        } catch {
          tutoriasRes = await axios.get(`http://localhost:4000/api/horarios/reservas/profesor/${user._id}`);
        }
      } else {
        try {
          tutoriasRes = await axios.get(`http://localhost:4000/api/tutorias`, {
            params: { estudiante: user._id }
          });
        } catch {
          tutoriasRes = await axios.get(`http://localhost:4000/api/horarios/reservas/alumno/${user._id}`);
        }
      }

      // Obtener eventos
      const eventosRes = await axios.get(`http://localhost:4000/api/eventos`, {
        params: {
          owner: user._id,
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      });

      // Obtener reservas de espacios
      try {
        const reservasRes = await axios.get(`http://localhost:4000/api/recursos/reservas`, {
          params: { usuario: user._id }
        });
        setReservas(reservasRes.data || []);
      } catch {
        setReservas([]);
      }

      // Obtener todos los usuarios y filtrar profesores
      try {
        const usuariosRes = await axios.get(`http://localhost:4000/api/usuarios`);
        const profesoresData = usuariosRes.data.filter(u => u.rol === 'profesor');
        setProfesores(profesoresData);
      } catch {
        setProfesores([]);
      }

      setTutorias(tutoriasRes.data || []);
      setEventos(eventosRes.data || []);
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
    startOfWeek.setDate(now.getDate() - now.getDay() + 1 + (selectedWeek * 7)); // Lunes
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59);

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
        const dayOfWeek = (fecha.getDay() + 6) % 7; // Lunes = 0
        return dayOfWeek === index;
      }).length;
      return { day, count };
    });
    return activity;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (date) => {
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
          {/* Asignaturas / Guías */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {user.rol === 'profesor' ? 'Asignaturas' : 'Asignaturas'}
              </h2>
              <span className="text-sm text-gray-500">2025-26</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <span className="text-sm font-medium">Robótica Computacional</span>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <span className="text-sm font-medium">Sistemas y Tecnologías Web</span>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <span className="text-sm font-medium">Visión por computador</span>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <span className="text-sm font-medium">Gestión del conocimiento...</span>
                <Icon name="chevron-right" className="w-4 h-4 text-gray-400" />
              </div>
            </div>
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
                      <div className="text-xs text-gray-500">{formatDate(reserva.fechaInicio)}</div>
                    </div>
                    <span className="text-xs text-gray-500">{formatTime(reserva.fechaInicio)}</span>
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
                        ? (tutoria.estudiante?.name || 'Estudiante')
                        : (tutoria.profesor?.name || 'Profesor')}
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

          {/* Eventos */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Eventos</h2>
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
