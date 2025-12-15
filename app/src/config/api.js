/**
 * Configuración centralizada del API
 * Gestiona las URLs del backend de forma consistente
 */

/**
 * Obtiene la URL base del API según el entorno
 * @returns {string} URL base del API
 */
export const getApiBaseUrl = () => {
  // Prioridad 1: Variable de entorno de Vite
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Prioridad 2: LocalStorage (para desarrollo/testing)
  if (typeof window !== 'undefined') {
    const localStorageUrl = window.localStorage.getItem('API_BASE') || window.__API_BASE__;
    if (localStorageUrl) {
      return localStorageUrl;
    }
  }
  
  // Prioridad 3: Variables de entorno legacy
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.REACT_APP_API_BASE) {
      return process.env.REACT_APP_API_BASE;
    }
    if (process.env.VITE_API_BASE) {
      return process.env.VITE_API_BASE;
    }
  }
  
  // Valor por defecto: string vacío para usar el proxy de Vite en desarrollo
  // En producción se usará VITE_API_URL
  return '';
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
  
  const defaultOptions = {
    credentials: 'include',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
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
