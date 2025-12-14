import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../config/api';
import Icon from '../components/Icon';

function Perfil({ user }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    telefono: '',
    avatarUrl: '',
    biography: '',
    username: '',
    asignaturasCursadas: []
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Estado para cambio de contraseña
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Lista de asignaturas por curso
  const asignaturasDisponibles = [
    { 
      curso: 'Curso 1', 
      asignaturas: [
        { cuatrimestre: 'Primer cuatrimestre', items: [
          '139261011 - Informática Básica',
          '139261012 - Álgebra',
          '139261013 - Cálculo',
          '139261014 - Fundamentos Físicos para la Ingeniería',
          '139261015 - Organizaciones Empresariales'
        ]},
        { cuatrimestre: 'Segundo cuatrimestre', items: [
          '139261021 - Algoritmos y Estructuras de Datos',
          '139261022 - Principios de Computadores',
          '139261023 - Optimización',
          '139261024 - Sistemas Electrónicos Digitales',
          '139261025 - Expresión Gráfica en Ingeniería'
        ]}
      ]
    },
    { 
      curso: 'Curso 2', 
      asignaturas: [
        { cuatrimestre: 'Primer cuatrimestre', items: [
          '139262011 - Estadística',
          '139262012 - Computabilidad y Algoritmia',
          '139262013 - Estructura de Computadores',
          '139262014 - Sistemas Operativos',
          '139262015 - Inglés Técnico'
        ]},
        { cuatrimestre: 'Segundo cuatrimestre', items: [
          '139262021 - Algoritmos y Estructuras de Datos Avanzadas',
          '139262022 - Redes y Sistemas Distribuidos',
          '139262023 - Administración de Sistemas',
          '139262024 - Fundamentos de Ingeniería del Software',
          '139262025 - Código Deontológico y Aspectos Legales'
        ]}
      ]
    },
    { 
      curso: 'Curso 3', 
      asignaturas: [
        { cuatrimestre: 'Primer cuatrimestre', items: [
          '139263011 - Bases de Datos',
          '139263012 - Inteligencia Artificial',
          '139263013 - Sistemas de Interacción Persona-Computador',
          '139263014 - Lenguajes y Paradigmas de Programación',
          '139263015 - Gestión de Proyectos Informáticos'
        ]},
        { cuatrimestre: 'Segundo cuatrimestre', items: [
          '139263121 - Procesadores de Lenguajes',
          '139263122 - Diseño y Análisis de Algoritmos',
          '139263123 - Programación de Aplicaciones Interactivas',
          '139263124 - Inteligencia Artificial Avanzada',
          '139263125 - Tratamiento Inteligente de Datos',
          '139263221 - Diseño de Procesadores',
          '139263222 - Arquitectura de Computadores',
          '139263225 - Sistemas Operativos Avanzados',
          '139263226 - Redes de Computadores en Ingeniería de Computadores',
          '139263227 - Laboratorio de Redes en Ingeniería de Computadores'
        ]}
      ]
    },
    { 
      curso: 'Curso 4', 
      asignaturas: [
        { cuatrimestre: 'Primer cuatrimestre', items: [
          '139260901 - Administración y Diseño de Bases de Datos',
          '139260902 - Visión por Computador',
          '139264111 - Interfaces Inteligentes',
          '139264112 - Sistemas Inteligentes',
          '139264211 - Sistemas Empotrados',
          '139264311 - Laboratorio de Desarrollo y Herramientas'
        ]},
        { cuatrimestre: 'Segundo cuatrimestre', items: [
          '139264021 - Inteligencia Emocional',
          '139264022 - Prácticas Externas',
          '139264023 - Trabajo de Fin de Grado'
        ]}
      ]
    }
  ];

  const API_BASE =
    (typeof window !== 'undefined' && (window.__API_BASE__ || window.localStorage.getItem('API_BASE'))) ||
    (typeof process !== 'undefined' && (process.env && (process.env.REACT_APP_API_BASE || process.env.VITE_API_BASE))) ||
    'https://proyecto-e19.onrender.com';

  const fetchApi = (path, opts = {}) => {
    const p = path.startsWith('/') ? path : `/${path}`;
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    return fetch(`${API_BASE}${p}`, { ...opts, headers });
  };

  useEffect(() => {
    const loadUserData = async () => {
      if (!user || !(user._id || user.id)) {
        setLoading(false);
        return;
      }

      try {
        const userId = user._id || user.id;
        let res = await fetchApi(`/api/usuarios/${encodeURIComponent(userId)}`);
        if (!res.ok) res = await fetchApi(`/api/users/${encodeURIComponent(userId)}`);
        
        if (!res.ok) throw new Error('No se pudo cargar la información del usuario');
        
        const data = await res.json();
        setUserData(data);
        setFormData({
          name: data.name || '',
          fullName: data.fullName || '',
          email: data.email || '',
          telefono: data.telefono || '',
          avatarUrl: data.avatarUrl || '',
          biography: data.biography || '',
          username: data.username || '',
          asignaturasCursadas: data.asignaturasCursadas || []
        });
      } catch (err) {
        console.error('Error cargando datos del usuario:', err);
        setError('No se pudo cargar la información del perfil');
        setUserData(user);
        setFormData({
          name: user.name || '',
          fullName: user.fullName || '',
          email: user.email || '',
          telefono: user.telefono || '',
          avatarUrl: user.avatarUrl || '',
          biography: user.biography || '',
          username: user.username || '',
          asignaturasCursadas: user.asignaturasCursadas || []
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSave = async () => {
    if (!user || !(user._id || user.id)) {
      setError('Usuario no identificado');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userId = user._id || user.id;
      const res = await fetchApi(`/api/usuarios/${encodeURIComponent(userId)}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'No se pudo actualizar el perfil');
      }

      const updatedData = await res.json();
      setUserData(updatedData);
      setEditing(false);
      alert('Perfil actualizado correctamente');
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError('No se pudo actualizar el perfil: ' + (err.message || 'error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    // Validaciones
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setSavingPassword(true);

    try {
      const userId = user._id || user.id;
      const res = await fetchApi(`/api/usuarios/${encodeURIComponent(userId)}/cambiar-password`, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || body?.message || 'No se pudo cambiar la contraseña');
      }

      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Ocultar el formulario después de 2 segundos
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 2000);

    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setPasswordError(err.message || 'Error al cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      fullName: userData?.fullName || '',
      email: userData?.email || '',
      telefono: userData?.telefono || '',
      avatarUrl: userData?.avatarUrl || '',
      biography: userData?.biography || '',
      username: userData?.username || '',
      asignaturasCursadas: userData?.asignaturasCursadas || []
    });
    setEditing(false);
    setError(null);
  };

  const handleAsignaturaToggle = (asignatura) => {
    setFormData(prev => {
      const isSelected = prev.asignaturasCursadas.includes(asignatura);
      return {
        ...prev,
        asignaturasCursadas: isSelected
          ? prev.asignaturasCursadas.filter(a => a !== asignatura)
          : [...prev.asignaturasCursadas, asignatura]
      };
    });
  };

  const handleCancelPasswordChange = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordChange(false);
  };

  const getInitials = () => {
    const name = userData?.username || userData?.name || 'Usuario';
    return name.split(' ').map(n => n?.[0] || '').slice(0, 2).join('').toUpperCase();
  };

  const getRoleBadge = () => {
    const role = (userData?.rol || 'alumno').toLowerCase();
    const colors = {
      desarrollador: 'bg-red-100 text-red-700',
      profesor: 'bg-blue-100 text-blue-700',
      alumno: 'bg-green-100 text-green-700'
    };
    
    const labels = {
      desarrollador: 'Desarrollador',
      profesor: 'Profesor',
      alumno: 'Alumno'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors[role] || 'bg-gray-100 text-gray-700'}`}>
        {labels[role] || role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Cargando perfil...</div>
        </div>
      </div>
    );
  }

  if (!userData && !user) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm">
        <div className="text-center py-12">
          <Icon name="user" className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600">No se pudo cargar la información del perfil</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header con foto de perfil */}
      <div className="bg-gradient-to-r from-violet-600 to-violet-800 h-32 rounded-t-lg relative">
        <div className="absolute -bottom-16 left-8">
          <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
            {userData?.avatarUrl ? (
              <img src={userData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-3xl font-bold">
                {getInitials()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del perfil */}
      <div className="pt-20 px-8 pb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {userData?.username || userData?.name || 'Usuario'}
            </h1>
            <div className="flex items-center gap-3 mb-3">
              {getRoleBadge()}
              {userData?.email && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Icon name="mail" className="w-4 h-4" />
                  {userData.email}
                </span>
              )}
              {userData?.activo === false && (
                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                  Inactivo
                </span>
              )}
            </div>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Icon name="edit" className="w-4 h-4" />
              Editar perfil
            </button>
          ) : null}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de usuario *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Tu nombre de usuario"
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Tu nombre completo"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="+34 123 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL del avatar
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Biografía
              </label>
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Cuéntanos algo sobre ti..."
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {formData.biography.length}/1000 caracteres
              </div>
            </div>

            {/* Selector de asignaturas cursadas */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {userData?.rol === 'profesor' ? 'Asignaturas Impartidas' : 'Asignaturas Cursadas'}
              </label>
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto bg-white">
                {asignaturasDisponibles.map((cursoData, cursoIdx) => (
                  <div key={cursoIdx} className="mb-4 last:mb-0">
                    <h4 className="font-semibold text-violet-700 mb-2">{cursoData.curso}</h4>
                    {cursoData.asignaturas.map((cuatrimestreData, cuatIdx) => (
                      <div key={cuatIdx} className="mb-3">
                        <div className="text-xs font-medium text-gray-600 mb-2 pl-2">
                          {cuatrimestreData.cuatrimestre}
                        </div>
                        <div className="space-y-1 pl-4">
                          {cuatrimestreData.items.map((asignatura, asigIdx) => (
                            <label
                              key={asigIdx}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={formData.asignaturasCursadas.includes(asignatura)}
                                onChange={() => handleAsignaturaToggle(asignatura)}
                                className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
                              />
                              <span className="text-gray-700">{asignatura}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Seleccionadas: {formData.asignaturasCursadas.length} asignaturas
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon name="save" className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Icon name="x" className="w-4 h-4" />
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {userData?.biography && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 leading-relaxed">
                  {userData.biography}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userData?.fullName && (
                <div>
                  <div className="text-sm font-semibold text-gray-500 mb-1">Nombre completo</div>
                  <div className="text-gray-800">{userData.fullName}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1">Teléfono</div>
                <div className="text-gray-800 flex items-center gap-2">
                  {userData?.telefono ? (
                    <>
                      <Icon name="phone" className="w-4 h-4 text-violet-600" />
                      {userData.telefono}
                    </>
                  ) : (
                    'No especificado'
                  )}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-500 mb-1">Estado</div>
                <div className="text-gray-800">
                  {userData?.activo !== false ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <Icon name="check-circle" className="w-4 h-4" />
                      Cuenta activa
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <Icon name="x-circle" className="w-4 h-4" />
                      Cuenta inactiva
                    </span>
                  )}
                </div>
              </div>

              {userData?.meta && Object.keys(userData.meta).length > 0 && (
                <div className="md:col-span-2">
                  <div className="text-sm font-semibold text-gray-500 mb-1">Información adicional</div>
                  <div className="text-gray-800 bg-gray-50 p-4 rounded-lg">
                    {Object.entries(userData.meta).map(([key, value]) => (
                      <div key={key} className="flex gap-2 mb-1">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Información adicional */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles de la cuenta</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="calendar" className="w-4 h-4 text-violet-600" />
                  <span>
                    Miembro desde: {userData?.createdAt 
                      ? new Date(userData.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Fecha no disponible'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="refresh-cw" className="w-4 h-4 text-violet-600" />
                  <span>
                    Última actualización: {userData?.updatedAt 
                      ? new Date(userData.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sección de asignaturas cursadas */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {userData?.rol === 'profesor' ? 'Asignaturas Impartidas' : 'Asignaturas Cursadas'}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  {userData?.rol === 'profesor' 
                    ? 'Selecciona las asignaturas que impartes' 
                    : 'Selecciona las asignaturas que estás cursando o has cursado'}
                </p>
                
                {userData?.asignaturasCursadas && userData.asignaturasCursadas.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {userData.asignaturasCursadas.map((asignatura, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm"
                        >
                          {asignatura}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Total: {userData.asignaturasCursadas.length} asignaturas
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    No has seleccionado ninguna asignatura. Haz clic en "Editar perfil" para añadir asignaturas.
                  </div>
                )}
              </div>
            </div>

            {/* Sección de 
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Icon name="refresh-cw" className="w-4 h-4 text-violet-600" />
                  <span>
                    Última actualización: {userData?.updatedAt 
                      ? new Date(userData.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'No disponible'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sección de cambio de contraseña */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Seguridad</h3>
                {!showPasswordChange && (
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm"
                  >
                    <Icon name="cog" className="w-4 h-4" />
                    Cambiar contraseña
                  </button>
                )}
              </div>

              {showPasswordChange && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-4">Cambiar contraseña</h4>
                  
                  {passwordError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                      <Icon name="x-circle" className="w-5 h-5 flex-shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                      <Icon name="check-circle" className="w-5 h-5 flex-shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contraseña actual *
                      </label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Ingresa tu contraseña actual"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nueva contraseña *
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Mínimo 6 caracteres"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Confirmar nueva contraseña *
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        placeholder="Repite la nueva contraseña"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handlePasswordChange}
                        disabled={savingPassword}
                        className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Icon name="save" className="w-4 h-4" />
                        {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
                      </button>
                      <button
                        onClick={handleCancelPasswordChange}
                        disabled={savingPassword}
                        className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Icon name="x" className="w-4 h-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Perfil;