const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const conexion = require('../config/database');

const SECRET = process.env.JWT_SECRET || 'clave_secreta_mundial';

const register = async (req, res) => {
    const { nombre, correo, password } = req.body;

    if (!nombre || !correo || !password) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        conexion.query(
            `INSERT INTO usuario (nombre, correo, password, rol, activo)
             VALUES ($1, $2, $3, 'USUARIO', TRUE) RETURNING id`,
            [nombre, correo, hash],
            (error, resultado) => {
                if (error) {
                    if (error.code === '23505') { // PostgreSQL unique violation code
                        return res.status(409).json({ mensaje: 'El correo ya está registrado' });
                    }
                    return res.status(500).json({ mensaje: 'Error al registrar usuario', detalles: error.message });
                }
                res.status(201).json({ mensaje: 'Usuario registrado', id: resultado.rows[0].id });
            }
        );
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
};

const login = (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    conexion.query(
        'SELECT * FROM usuario WHERE correo = $1 AND activo = TRUE',
        [correo],
        async (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error en el servidor', detalles: error.message });
            if (!resultados || resultados.rows.length === 0) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }

            const usuario = resultados.rows[0];

            try {
                const match = await bcrypt.compare(password, usuario.password);
                if (!match) {
                    return res.status(401).json({ mensaje: 'Contraseña incorrecta' });
                }

                const token = jwt.sign(
                    { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
                    SECRET,
                    { expiresIn: '8h' }
                );

                res.json({
                    mensaje: 'Login exitoso',
                    token,
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        correo: usuario.correo,
                        rol: usuario.rol
                    }
                });
            } catch (err) {
                res.status(500).json({ mensaje: 'Error al verificar contraseña' });
            }
        }
    );
};

module.exports = { register, login };
