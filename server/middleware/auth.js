import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Use environment variable or generate a secure random 256-bit key at runtime
export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Middleware to verify JWT token in Authorization header
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Acceso denegado: Token JWT ausente en la cabecera' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de cabecera inválido. Usa: Bearer <token>' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Por favor inicia sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token JWT inválido o corrupto' });
  }
};

// Middleware to enforce specific roles (e.g. 'teacher')
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso restringido: Se requiere rol [${roles.join(', ')}] para ejecutar esta acción sináptica.`
      });
    }

    return next();
  };
};

// Optional token middleware for public read with authenticated perks
export const optionalToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        const decoded = jwt.verify(parts[1], JWT_SECRET);
        req.user = decoded;
      } catch (err) {
        // Silently continue if optional token fails
      }
    }
  }
  return next();
};
