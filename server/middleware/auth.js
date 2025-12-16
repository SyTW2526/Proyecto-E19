import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Obtener token de cookies o header Authorization
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token no encontrado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar usuario en la colección User (no Recurso)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'user_not_found', message: 'Usuario no encontrado' });
    }

    // Verificar que el usuario esté activo
    if (user.activo === false) {
      return res.status(401).json({ error: 'user_inactive', message: 'Usuario inactivo' });
    }

    // Agregar usuario a req
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'invalid_token', message: 'Token inválido' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token_expired', message: 'Token expirado' });
    }
    
    return res.status(401).json({ error: 'authentication_failed', message: 'Fallo en la autenticación' });
  }
};

// Middleware para verificar roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'not_authenticated', message: 'No estás autenticado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'forbidden', 
        message: `Rol ${req.user.rol} no tiene permisos. Se requiere uno de: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

export default { protect, authorize };