import React from 'react';
import useApi from '../hooks/useApi';

// Ejemplo 1: GET automático con cache
const UserProfile = () => {
  const { data: user, loading, error, refetch } = useApi(
    'http://localhost:4000/api/auth/me',
    { cacheTime: 5 * 60 * 1000 } // Cache por 5 minutos
  );

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <button onClick={() => refetch()}>Actualizar</button>
    </div>
  );
};

// Ejemplo 2: POST manual sin cache
const CreateTutoria = () => {
  const { execute, loading, error } = useApi(
    'http://localhost:4000/api/tutorias',
    {
      method: 'POST',
      enableCache: false,
      autoFetch: false,
      onSuccess: (data) => console.log('Tutoría creada:', data)
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await execute({
      data: {
        tema: 'Consulta sobre React',
        descripcion: 'Necesito ayuda con hooks',
        // ...más datos
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ...campos del formulario... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Tutoría'}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
};

export { UserProfile, CreateTutoria };
