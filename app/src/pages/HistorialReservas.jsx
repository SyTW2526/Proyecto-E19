import React from 'react';

function HistorialReservas() {
  const [historialReservas, setHistorialReservas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState(null);
  const [filterType, setFilterType] = React.useState('all');
  const [filterEstado, setFilterEstado] = React.useState('all');

  React.useEffect(() => {
    fetchHistorial();
  }, []);

  const types = React.useMemo(() => {
    const t = Array.from(new Set(historialReservas.map(r => r.recurso?.tipo).filter(Boolean)));
    return ['all', ...t];
  }, [historialReservas]);

  const estados = ['all', 'confirmada', 'cancelada', 'completada'];

  const fetchHistorial = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const res = await fetch('/api/recursos/mis-reservas', { credentials: 'include' });
      
      if (!res.ok) {
        let body = null;
        try { 
          body = await res.json(); 
        } catch (e) { 
          body = await res.text().catch(() => null); 
        }
        
        if (res.status === 401) {
          setMessage({ type: 'error', text: 'Debes iniciar sesión para ver tu historial' });
          return;
        }
        
        console.error('Historial fetch error:', res.status, body);
        setMessage({ type: 'error', text: `No se pudo cargar el historial (status ${res.status})` });
        return;
      }
      
      const data = await res.json();
      setHistorialReservas(data || []);
    } catch (err) {
      console.error('Error fetching historial:', err);
      setMessage({ type: 'error', text: 'Error de conexión al cargar el historial' });
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = (tipo) => {
    if (tipo === 'all') return 'Todas';
    return tipo.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatEstado = (estado) => {
    if (estado === 'all') return 'Todos';
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const filteredReservas = React.useMemo(() => {
    let filtered = historialReservas;
    
    // Filtrar por tipo de recurso
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.recurso?.tipo === filterType);
    }
    
    // Filtrar por estado
    if (filterEstado !== 'all') {
      filtered = filtered.filter(r => r.estado === filterEstado);
    }
    
    // Ordenar por fecha descendente (más recientes primero)
    return filtered.sort((a, b) => new Date(b.fechaReserva) - new Date(a.fechaReserva));
  }, [historialReservas, filterType, filterEstado]);

  return (
    <div className="mt-4">
      {/* Filtros */}
      {!loading && historialReservas.length > 0 && (
        <div className="mb-4 space-y-3">
          {/* Filtro por tipo de recurso */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Tipo de espacio</p>
            <div className="flex flex-wrap gap-2">
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
                    filterType === t 
                      ? 'bg-[#7024BB] text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {formatLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Estado</p>
            <div className="flex flex-wrap gap-2">
              {estados.map(e => (
                <button
                  key={e}
                  onClick={() => setFilterEstado(e)}
                  className={`text-sm px-4 py-2 rounded-full font-medium transition-all ${
                    filterEstado === e 
                      ? 'bg-[#7024BB] text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {formatEstado(e)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mb-4 p-4 rounded-xl ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7024BB]"></div>
        </div>
      )}

      {!loading && historialReservas.length === 0 && !message && (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No hay historial de reservas</p>
          <p className="text-gray-400 text-sm mt-2">Tus reservas pasadas aparecerán aquí</p>
        </div>
      )}

      {!loading && filteredReservas.length === 0 && historialReservas.length > 0 && (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500 text-lg">No se encontraron reservas</p>
          <p className="text-gray-400 text-sm mt-2">Prueba con otros filtros</p>
        </div>
      )}

      {!loading && filteredReservas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReservas.map((r) => (
            <div key={r._id} className="p-5 rounded-xl bg-gray-50 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{r.recurso?.nombre || 'Recurso'}</h3>
                  <p className="text-sm text-gray-500 mt-1">{r.recurso?.ubicacion || 'Sin ubicación'}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${
                  r.estado === 'confirmada' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : r.estado === 'cancelada'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : r.estado === 'completada'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {r.estado === 'confirmada' ? (
                    <>✓ Confirmada</>
                  ) : r.estado === 'cancelada' ? (
                    <>✕ Cancelada</>
                  ) : r.estado === 'completada' ? (
                    <>✓ Completada</>
                  ) : (
                    r.estado || 'Confirmada'
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{new Date(r.fechaReserva).toLocaleDateString('es-ES', { 
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
                  <span>{new Date(r.fechaReserva).toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
                {r.recurso?.tipo && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-[#7024BB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="capitalize">{r.recurso.tipo.replace(/_/g, ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistorialReservas;
