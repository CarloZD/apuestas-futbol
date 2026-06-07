const conexion = require('../config/database');

const listar = (req, res) => {
    conexion.query(
        `SELECT s.*, u.nombre AS creador
         FROM sala s
         INNER JOIN usuario u ON s.creador_id = u.id
         ORDER BY s.fecha_creacion DESC`,
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            res.json(resultados);
        }
    );
};

const obtenerPorId = (req, res) => {
    const salaId = req.params.id;
    conexion.query(
        `SELECT s.*, u.nombre AS creador
         FROM sala s
         INNER JOIN usuario u ON s.creador_id = u.id
         WHERE s.id = ?`,
        [salaId],
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            if (resultados.length === 0) return res.status(404).json({ mensaje: 'Sala no encontrada' });
            res.json(resultados[0]);
        }
    );
};

const crear = (req, res) => {
    const { nombre, codigo_invitacion } = req.body;
    const creador_id = req.usuario.id;

    if (!nombre || !codigo_invitacion) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    conexion.query(
        `INSERT INTO sala (nombre, codigo_invitacion, creador_id) VALUES (?, ?, ?)`,
        [nombre, codigo_invitacion, creador_id],
        (error, resultado) => {
            if (error) {
                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ mensaje: 'El código de invitación ya está en uso' });
                }
                return res.status(500).json(error);
            }

            conexion.query(
                `INSERT INTO miembro_sala (usuario_id, sala_id) VALUES (?, ?)`,
                [creador_id, resultado.insertId],
                (error2) => {
                    if (error2) return res.status(500).json(error2);
                    res.status(201).json({ mensaje: 'Sala creada', id: resultado.insertId });
                }
            );
        }
    );
};

const unirse = (req, res) => {
    const { codigo_invitacion } = req.body;
    const usuario_id = req.usuario.id;

    if (!codigo_invitacion) {
        return res.status(400).json({ mensaje: 'Falta el código de invitación' });
    }

    conexion.query(
        'SELECT * FROM sala WHERE codigo_invitacion = ?',
        [codigo_invitacion],
        (error, salas) => {
            if (error) return res.status(500).json(error);
            if (salas.length === 0) return res.status(404).json({ mensaje: 'Sala no encontrada' });

            const sala = salas[0];

            conexion.query(
                `INSERT INTO miembro_sala (usuario_id, sala_id) VALUES (?, ?)`,
                [usuario_id, sala.id],
                (error) => {
                    if (error) {
                        if (error.code === 'ER_DUP_ENTRY') {
                            return res.status(409).json({ mensaje: 'Ya eres miembro de esta sala' });
                        }
                        return res.status(500).json(error);
                    }
                    res.json({ mensaje: 'Te uniste a la sala', sala: { id: sala.id, nombre: sala.nombre } });
                }
            );
        }
    );
};

const participantes = (req, res) => {
    const salaId = req.params.id;
    conexion.query(
        `SELECT u.id, u.nombre, u.correo, ms.fecha_union
         FROM miembro_sala ms
         INNER JOIN usuario u ON ms.usuario_id = u.id
         WHERE ms.sala_id = ?
         ORDER BY ms.fecha_union ASC`,
        [salaId],
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            res.json(resultados);
        }
    );
};

const eliminar = (req, res) => {
    const salaId = req.params.id;
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    conexion.query('SELECT * FROM sala WHERE id = ?', [salaId], (error, salas) => {
        if (error) return res.status(500).json(error);
        if (salas.length === 0) return res.status(404).json({ mensaje: 'Sala no encontrada' });

        const sala = salas[0];

        if (sala.creador_id !== usuarioId && rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta sala' });
        }

        conexion.query('DELETE FROM sala WHERE id = ?', [salaId], (error) => {
            if (error) return res.status(500).json(error);
            res.json({ mensaje: 'Sala eliminada' });
        });
    });
};

module.exports = { listar, obtenerPorId, crear, unirse, participantes, eliminar };