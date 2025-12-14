import React from 'react';
import Icon from '../components/Icon';

function ReservaEspacios({ menu, activeSubsection }) {
  const item = menu.find((m) => m.id === activeSubsection) || {};
  const [spaces, setSpaces] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [filterType, setFilterType] = React.useState('all');
  const [reservas, setReservas] = React.useState([]);
  const [myReservas, setMyReservas] = React.useState([]);
  const [inicio, setInicio] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  React.useEffect(() => {
    fetchSpaces();
    fetchMyReservas();
  }, []);

  const types = React.useMemo(() => {
    const t = Array.from(new Set(spaces.map(s => s.tipo).filter(Boolean)));
    return ['all', ...t];
  }, [spaces]);

  const fetchSpaces = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recursos', { credentials: 'include' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setSpaces(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'No se pudieron cargar los espacios' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationsFor = async (spaceId) => {
    try {
      const res = await fetch(`/api/recursos/${spaceId}/reservas`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setReservas(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'No se pudieron cargar las reservas del espacio' });
    }
  };

  const fetchMyReservas = async () => {
    try {
      const res = await fetch('/api/recursos/mis-reservas', { credentials: 'include' });
      if (!res.ok) {
        let body = null;
        try { body = await res.json(); } catch (e) { body = await res.text().catch(() => null); }
        if (res.status === 401) {
          // no autenticado: no mostrar mensaje intrusivo en esta vista, pero loguear para debug
          console.debug('fetchMyReservas: not authenticated');
          return;
        }
        console.error('fetchMyReservas error', res.status, body);
        return;
      }
      const data = await res.json();
      setMyReservas(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (space) => {
    setSelected(space);
    setReservas([]);
    fetchReservationsFor(space._id);
    setMessage(null);
  };

  const handleReserve = async () => {
    setMessage(null);
    if (!selected) return setMessage({ type: 'error', text: 'Selecciona un espacio primero' });
    if (!inicio) return setMessage({ type: 'error', text: 'Introduce fecha/hora de la reserva' });

    try {
      setLoading(true);
      const body = { fechaReserva: new Date(inicio).toISOString() };
      const res = await fetch(`/api/recursos/${selected._id}/reservas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        const j = await res.json();
        setMessage({ type: 'error', text: j.details || 'Conflicto: la franja está ocupada' });
        return;
      }
      if (!res.ok) {
        const j = await res.json();
        setMessage({ type: 'error', text: j.error || `Error ${res.status}` });
        return;
      }

      const created = await res.json();
      setMessage({ type: 'success', text: 'Reserva creada correctamente' });
      // refrescar reservas del recurso y mis reservas
      fetchReservationsFor(selected._id);
      fetchMyReservas();
      // limpiar campo
      setInicio('');
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al crear la reserva' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Two professional widgets: left = lista de espacios, right = detalle/reservas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget izquierdo: Lista de espacios */}
        <div className="col-span-1">
          <section className="p-6 rounded-xl bg-gray-50 h-full">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Espacios disponibles</h4>
            </div>
            
            {/* Filtros por tipo */}
            <div className="mb-4 flex flex-wrap gap-2">
              {types.map(t => {
                const formatLabel = (tipo) => {
                  if (tipo === 'all') return 'Todos';
                  return tipo.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                };
                return (
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
                );
              })}
            </div>

            {loading && <p className="text-sm text-gray-500">Cargando espacios...</p>}
            
            {/* Lista de espacios */}
            <div className="space-y-3">
              {spaces
                .filter(s => filterType === 'all' || s.tipo === filterType)
                .map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelect(s)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      selected && selected._id === s._id 
                        ? 'bg-white ring-2 ring-[#7024BB]' 
                        : 'bg-white hover:bg-[#f5f0ff]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{s.nombre}</div>
                        <div className="text-xs text-gray-500 mt-1">{s.ubicacion}</div>
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        cap. {s.capacidad || 1}
                      </div>
                    </div>
                  </button>
                ))}
              {spaces.filter(s => filterType === 'all' || s.tipo === filterType).length === 0 && !loading && (
                <div className="text-sm text-gray-500 text-center py-8">No hay espacios disponibles con este filtro.</div>
              )}
            </div>
          </section>
        </div>

        {/* Widget derecho: Detalle y reservas */}
        <div className="col-span-1">
          <section className="p-6 rounded-xl bg-gray-50 h-full">
            <h3 className="sr-only">Detalle del espacio</h3>
            
            {!selected && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm">Selecciona un espacio para ver el detalle y reservar</p>
                </div>
              </div>
            )}

            {selected && (
              <div className="space-y-6">
                {/* Encabezado del espacio */}
                <div className="pb-4 border-b border-gray-200">
                  <h4 className="font-bold text-xl text-gray-900">{selected.nombre}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selected.ubicacion}</p>
                  {selected.descripcion && (
                    <p className="text-sm text-gray-500 mt-2">{selected.descripcion}</p>
                  )}
                </div>

                {/* Formulario de reserva */}
                <div className="space-y-3">
                  <style>{`
                    input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                      cursor: pointer;
                      border-radius: 0.5rem;
                      padding: 0.25rem;
                      filter: invert(0.4);
                    }
                    input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
                      background-color: rgba(112, 36, 187, 0.1);
                      filter: invert(0.3) sepia(1) saturate(5) hue-rotate(245deg);
                    }
                  `}</style>
                  <label className="block text-sm font-medium text-gray-700">Fecha y hora de la reserva</label>
                  <input 
                    type="datetime-local" 
                    value={inicio} 
                    onChange={(e) => setInicio(e.target.value)} 
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#7024BB] focus:border-transparent transition-all" 
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleReserve} 
                    disabled={loading} 
                    className="flex-1 px-6 py-3 bg-[#7024BB] hover:bg-[#5a1d99] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Reservando...' : 'Reservar'}
                  </button>
                  <button 
                    onClick={() => fetchReservationsFor(selected._id)} 
                    className="px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl border border-gray-300 font-medium transition-all"
                  >
                    ↻
                  </button>
                </div>

                {/* Lista de reservas existentes */}
                <div className="pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Reservas actuales</h5>
                  {reservas.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-500">No hay reservas registradas</p>
                    </div>
                  )}
                  <ul className="space-y-3">
                    {reservas.map((r) => (
                      <li key={r._id} className="p-4 rounded-xl bg-white border border-gray-200 hover:border-[#7024BB] transition-all">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-[#7024BB] text-white flex items-center justify-center text-xs font-semibold">
                                {(r.usuario?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className="text-sm font-semibold text-gray-900">{r.usuario?.name || 'Usuario'}</div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>{new Date(r.fechaReserva).toLocaleDateString('es-ES', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{new Date(r.fechaReserva).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}</span>
                            </div>
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
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default ReservaEspacios;
