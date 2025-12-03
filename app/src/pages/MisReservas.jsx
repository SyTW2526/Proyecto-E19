import React from 'react';

function MisReservas() {
  const [misReservas, setMisReservas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState(null);
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [reservaToCancel, setReservaToCancel] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [reservaToEdit, setReservaToEdit] = React.useState(null);
  const [newTime, setNewTime] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');

  React.useEffect(() => {
    fetchMy();
  }, []);

  const types = React.useMemo(() => {
    const t = Array.from(new Set(misReservas.map(r => r.recurso?.tipo).filter(Boolean)));
    return ['all', ...t];
  }, [misReservas]);

  const fetchMy = async () => {
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
          setMessage({ type: 'error', text: 'Debes iniciar sesión para ver tus reservas' });
          return;
        }
        
        console.error('MisReservas fetch error:', res.status, body);
        setMessage({ type: 'error', text: `No se pudieron cargar tus reservas (status ${res.status})` });
        return;
      }
      
      const data = await res.json();
      setMisReservas(data || []);
    } catch (err) {
      console.error('Error fetching reservas:', err);
      setMessage({ type: 'error', text: 'Error de conexión al cargar tus reservas' });
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = async () => {
    if (!reservaToCancel) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/recursos/${reservaToCancel.recurso?._id}/reservas/${reservaToCancel._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: j.error || `Error ${res.status}` });
        return;
      }
      
      setMessage({ type: 'success', text: 'Reserva cancelada correctamente' });
      fetchMy();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cancelar la reserva' });
    } finally {
      setLoading(false);
      setShowCancelModal(false);
      setReservaToCancel(null);
    }
  };

  const handleEdit = (reserva) => {
    setReservaToEdit(reserva);
    const fecha = new Date(reserva.fechaReserva);
    const timeString = fecha.toTimeString().slice(0, 5);
    setNewTime(timeString);
    setShowEditModal(true);
  };

  const confirmEdit = async () => {
    if (!reservaToEdit || !newTime) return;
    
    try {
      setLoading(true);
      const [hours, minutes] = newTime.split(':');
      const fecha = new Date(reservaToEdit.fechaReserva);
      fecha.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const res = await fetch(`/api/recursos/${reservaToEdit.recurso?._id}/reservas/${reservaToEdit._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fechaReserva: fecha.toISOString() })
      });
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMessage({ type: 'error', text: j.error || `Error ${res.status}` });
        return;
      }
      
      setMessage({ type: 'success', text: 'Reserva actualizada correctamente' });
      fetchMy();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al actualizar la reserva' });
    } finally {
      setLoading(false);
      setShowEditModal(false);
      setReservaToEdit(null);
      setNewTime('');
    }
  };

  const formatLabel = (tipo) => {
    if (tipo === 'all') return 'Todas';
    return tipo.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filteredReservas = React.useMemo(() => {
    if (filterType === 'all') return misReservas;
    return misReservas.filter(r => r.recurso?.tipo === filterType);
  }, [misReservas, filterType]);

  return (
    <div className="mt-4">
      {/* Filtros por tipo */}
      {!loading && misReservas.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
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

      {!loading && misReservas.length === 0 && !message && (
        <div className="text-center py-16">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No tienes reservas todavía</p>
          <p className="text-gray-400 text-sm mt-2">Ve a "Buscar espacio" para hacer tu primera reserva</p>
        </div>
      )}

      {!loading && filteredReservas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReservas.map((r) => (
            <div key={r._id} className="p-5 rounded-xl bg-gray-50 hover:ring-2 hover:ring-[#7024BB] transition-all">
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
                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                }`}>
                  {r.estado === 'confirmada' ? (
                    <>✓ Confirmada</>
                  ) : r.estado === 'cancelada' ? (
                    <>✕ Cancelada</>
                  ) : (
                    r.estado || 'Confirmada'
                  )}
                </span>
              </div>

              <div className="space-y-2 mb-4">
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

              {r.estado !== 'cancelada' && (
                <button 
                  onClick={() => { setReservaToCancel(r); setShowCancelModal(true); }} 
                  disabled={loading}
                  className="w-full px-4 py-2.5 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-xl hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancelar reserva
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50 p-4 rounded-tl-3xl" onClick={() => setShowCancelModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 text-center mb-2">¿Cancelar reserva?</h3>
              <p className="text-sm text-gray-600 text-center">
                ¿Estás seguro de que quieres cancelar la reserva de <strong>{reservaToCancel?.recurso?.nombre}</strong>?
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowCancelModal(false); setReservaToCancel(null); }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                No, volver
              </button>
              <button 
                onClick={confirmCancel}
                disabled={loading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MisReservas;
