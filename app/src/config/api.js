/**
 * Configuración centralizada del API
 * Gestiona las URLs del backend de forma consistente
 */

/**
 * Obtiene la URL base del API según el entorno
 * @returns {string} URL base del API
 */
export const getApiBaseUrl = () => {
  // Prioridad 1: Variable de entorno de Vite (Render la inyecta en producción)
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Prioridad 2: Detectar si estamos en modo desarrollo (Docker local)
  if (import.meta.env.DEV) {
    return 'http://localhost:4000';
  }
  
  // Prioridad 3: LocalStorage (para testing manual)
  if (typeof window !== 'undefined') {
    const localStorageUrl = window.localStorage.getItem('API_BASE') || window.__API_BASE__;
    if (localStorageUrl) {
      return localStorageUrl;
    }
  }
  
  // Valor por defecto: URL de producción (fallback si Render no inyecta la variable)
  return 'https://proyecto-e19.onrender.com';
};

/**
 * Realiza una petición fetch al API con configuración por defecto
 * @param {string} path - Ruta del endpoint (puede empezar con o sin /)
 * @param {RequestInit} options - Opciones de fetch
 * @returns {Promise<Response>} Respuesta del fetch
 */
export const fetchApi = async (path, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;
  
  // Obtener token de localStorage si existe
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  const defaultOptions = {
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Añadir token si existe
      ...options.headers,
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  // Log para debugging en desarrollo
  if (import.meta.env.DEV && !response.ok) {
    console.debug(`[fetchApi] ${options.method || 'GET'} ${url} -> ${response.status}`);
  }
  
  return response;
};

// export { API_BASE };

/**
 * Construye una URL completa del API
 * @param {string} path - Ruta del endpoint
 * @returns {string} URL completa
 */
export const getApiUrl = (path) => {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};