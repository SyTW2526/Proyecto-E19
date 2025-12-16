import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    // Obtener token de cookie o header
    if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'No autorizado - Token no encontrado' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // OPTIMIZACIÓN: Seleccionar solo campos necesarios
    req.user = await User.findById(decoded.id)
      .select('-password -__v') // Excluir password y __v
      .lean(); // Usar lean() para objetos planos (mejor rendimiento)

    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificar si el usuario está activo
    if (!req.user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    next();
  } catch (error) {
    console.error('Error en middleware protect:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    res.status(500).json({ error: 'Error de servidor en autenticación' });
  }
};

// Middleware para verificar roles específicos
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: `Rol ${req.user.rol} no autorizado para esta acción` 
      });
    }

    next();
  };
};

export default { protect, authorize };