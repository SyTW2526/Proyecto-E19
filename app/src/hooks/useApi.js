import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Cache global para almacenar respuestas
const apiCache = new Map();
const pendingRequests = new Map();

const useApi = (url, options = {}) => {
  const {
    method = 'GET',
    initialData = null,
    dependencies = [],
    cacheTime = 5 * 60 * 1000, // 5 minutos por defecto
    enableCache = true,
    autoFetch = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const getCacheKey = (url, method) => `${method}:${url}`;

  const fetchData = useCallback(async (config = {}) => {
    if (!url) return;

    const cacheKey = getCacheKey(url, method);
    
    // Verificar cache si está habilitado
    if (enableCache && method === 'GET' && apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      const isExpired = Date.now() - cached.timestamp > cacheTime;
      
      if (!isExpired) {
        setData(cached.data);
        return cached.data;
      }
    }

    // Deduplicar peticiones pendientes
    if (pendingRequests.has(cacheKey)) {
      return pendingRequests.get(cacheKey);
    }

    // Cancelar petición anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);

    const requestPromise = axios({
      url,
      method,
      signal: abortControllerRef.current.signal,
      withCredentials: true,
      ...config
    })
      .then(response => {
        if (!isMountedRef.current) return;
        
        const responseData = response.data;
        setData(responseData);

        // Guardar en cache si está habilitado
        if (enableCache && method === 'GET') {
          apiCache.set(cacheKey, {
            data: responseData,
            timestamp: Date.now()
          });
        }

        if (onSuccess) onSuccess(responseData);
        return responseData;
      })
      .catch(err => {
        if (axios.isCancel(err) || !isMountedRef.current) return;
        
        const errorMessage = err.response?.data?.error || err.message || 'Error en la petición';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        throw err;
      })
      .finally(() => {
        if (isMountedRef.current) {
          setLoading(false);
        }
        pendingRequests.delete(cacheKey);
      });

    pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }, [url, method, enableCache, cacheTime, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;

    if (url && method === 'GET' && autoFetch) {
      fetchData();
    }

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url, method, autoFetch, ...dependencies]);

  // Función para invalidar cache
  const invalidateCache = useCallback((targetUrl = url) => {
    const cacheKey = getCacheKey(targetUrl, method);
    apiCache.delete(cacheKey);
  }, [url, method]);

  // Función para limpiar todo el cache
  const clearAllCache = useCallback(() => {
    apiCache.clear();
  }, []);

  // Función para refetch manual
  const refetch = useCallback((config) => {
    invalidateCache();
    return fetchData(config);
  }, [fetchData, invalidateCache]);

  return {
    data,
    loading,
    error,
    refetch,
    invalidateCache,
    clearAllCache,
    execute: fetchData // Para ejecutar manualmente (POST, PUT, DELETE)
  };
};

export default useApi;
