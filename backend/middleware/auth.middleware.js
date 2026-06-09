const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'clave_secreta_mundial';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ mensaje: 'Token requerido' });
    }

    jwt.verify(token, SECRET, (err, usuario) => {
        if (err) {
            return res.status(403).json({ mensaje: 'Token inválido o expirado' });
        }
        req.usuario = usuario; // { id, nombre, rol }
        next();
    });
};

const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'ADMIN') {
        return res.status(403).json({ mensaje: 'Acceso solo para administradores' });
    }
    next();
};

module.exports = { verificarToken, soloAdmin };