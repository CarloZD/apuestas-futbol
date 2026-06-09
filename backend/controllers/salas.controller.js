const conexion = require('../config/database');

const listar = (req, res) => {
    const usuarioId = req.usuario.id;
    // Listar salas a las que pertenece el usuario
    const sql = `
        SELECT s.*, u.nombre AS creador,
               (SELECT COUNT(*) FROM miembro_sala WHERE sala_id = s.id) AS total_miembros,
               (SELECT COUNT(*) FROM sala_partido WHERE sala_id = s.id) AS total_partidos
        FROM sala s
        INNER JOIN usuario u ON s.creador_id = u.id
        INNER JOIN miembro_sala ms ON ms.sala_id = s.id
        WHERE ms.usuario_id = $1
        ORDER BY s.fecha_creacion DESC
    `;
    conexion.query(sql, [usuarioId], (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al listar salas', detalles: error.message });
        res.json(resultados.rows);
    });
};

const obtenerPorId = (req, res) => {
    const salaId = parseInt(req.params.id);
    conexion.query(
        `SELECT s.*, u.nombre AS creador
         FROM sala s
         INNER JOIN usuario u ON s.creador_id = u.id
         WHERE s.id = $1`,
        [salaId],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener sala', detalles: error.message });
            if (resultados.rows.length === 0) return res.status(404).json({ mensaje: 'Sala no encontrada' });
            res.json(resultados.rows[0]);
        }
    );
};

const crear = (req, res) => {
    const { nombre, codigo_invitacion, partidos } = req.body; // partidos: array de ids de partido
    const creador_id = req.usuario.id;

    if (!nombre || !codigo_invitacion) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos (nombre y código de invitación)' });
    }

    // Insertar la sala
    conexion.query(
        `INSERT INTO sala (nombre, codigo_invitacion, creador_id) VALUES ($1, $2, $3) RETURNING id`,
        [nombre, codigo_invitacion, creador_id],
        (error, resultado) => {
            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ mensaje: 'El código de invitación ya está en uso' });
                }
                return res.status(500).json({ mensaje: 'Error al crear la sala', detalles: error.message });
            }

            const salaId = resultado.rows[0].id;

            // Registrar al creador como miembro
            conexion.query(
                `INSERT INTO miembro_sala (usuario_id, sala_id) VALUES ($1, $2)`,
                [creador_id, salaId],
                (error2) => {
                    if (error2) return res.status(500).json({ mensaje: 'Error al unirse a la sala como creador', detalles: error2.message });

                    // Asociar partidos a la sala si se proporcionaron
                    if (partidos && Array.isArray(partidos) && partidos.length > 0) {
                        let inserts = partidos.map(partidoId => {
                            return new Promise((resolve, reject) => {
                                conexion.query(
                                    `INSERT INTO sala_partido (sala_id, partido_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                                    [salaId, parseInt(partidoId)],
                                    (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });
                        });

                        Promise.all(inserts)
                            .then(() => {
                                res.status(201).json({ mensaje: 'Sala creada y partidos asociados con éxito', id: salaId });
                            })
                            .catch(err => {
                                res.status(201).json({ mensaje: 'Sala creada pero hubo un error al asociar los partidos', id: salaId, error: err.message });
                            });
                    } else {
                        res.status(201).json({ mensaje: 'Sala creada con éxito sin partidos', id: salaId });
                    }
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
        'SELECT * FROM sala WHERE codigo_invitacion = $1',
        [codigo_invitacion.trim()],
        (error, salas) => {
            if (error) return res.status(500).json({ mensaje: 'Error al buscar sala', detalles: error.message });
            if (salas.rows.length === 0) return res.status(404).json({ mensaje: 'Código de invitación no válido' });

            const sala = salas.rows[0];

            conexion.query(
                `INSERT INTO miembro_sala (usuario_id, sala_id) VALUES ($1, $2)`,
                [usuario_id, sala.id],
                (error2) => {
                    if (error2) {
                        if (error2.code === '23505') {
                            return res.status(409).json({ mensaje: 'Ya eres miembro de esta sala' });
                        }
                        return res.status(500).json({ mensaje: 'Error al unirte a la sala', detalles: error2.message });
                    }
                    res.json({ mensaje: 'Te uniste a la sala con éxito', sala: { id: sala.id, nombre: sala.nombre } });
                }
            );
        }
    );
};

const participantes = (req, res) => {
    const salaId = parseInt(req.params.id);
    conexion.query(
        `SELECT u.id, u.nombre, u.correo, ms.fecha_union
         FROM miembro_sala ms
         INNER JOIN usuario u ON ms.usuario_id = u.id
         WHERE ms.sala_id = $1
         ORDER BY ms.fecha_union ASC`,
        [salaId],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener participantes', detalles: error.message });
            res.json(resultados.rows);
        }
    );
};

const eliminar = (req, res) => {
    const salaId = parseInt(req.params.id);
    const usuarioId = req.usuario.id;
    const rol = req.usuario.rol;

    conexion.query('SELECT * FROM sala WHERE id = $1', [salaId], (error, salas) => {
        if (error) return res.status(500).json({ mensaje: 'Error al buscar sala', detalles: error.message });
        if (salas.rows.length === 0) return res.status(404).json({ mensaje: 'Sala no encontrada' });

        const sala = salas.rows[0];

        if (sala.creador_id !== usuarioId && rol !== 'ADMIN') {
            return res.status(403).json({ mensaje: 'No tienes permiso para eliminar esta sala' });
        }

        conexion.query('DELETE FROM sala WHERE id = $1', [salaId], (error2) => {
            if (error2) return res.status(500).json({ mensaje: 'Error al eliminar sala', detalles: error2.message });
            res.json({ mensaje: 'Sala eliminada' });
        });
    });
};

const partidosDeSala = (req, res) => {
    const salaId = parseInt(req.params.id);
    const usuarioId = req.usuario.id;

    const sql = `
        SELECT
            p.id,
            p.codigo_api,
            el.nombre AS equipo_local,
            el.bandera_url AS bandera_local,
            ev.nombre AS equipo_visitante,
            ev.bandera_url AS bandera_visitante,
            p.fecha_partido,
            p.estado,
            p.goles_local,
            p.goles_visitante,
            pr.goles_local_pred,
            pr.goles_visitante_pred,
            pr.puntos_totales,
            pr.puntos_base,
            pr.bonus_anticipacion,
            pr.bonus_racha,
            pr.acierto_ganador
        FROM sala_partido sp
        INNER JOIN partido p ON sp.partido_id = p.id
        INNER JOIN equipo el ON p.equipo_local_id = el.id
        INNER JOIN equipo ev ON p.equipo_visitante_id = ev.id
        LEFT JOIN prediccion pr ON pr.partido_id = p.id AND pr.sala_id = sp.sala_id AND pr.usuario_id = $1
        WHERE sp.sala_id = $2
        ORDER BY p.fecha_partido ASC
    `;

    conexion.query(sql, [usuarioId, salaId], (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener partidos de la sala', detalles: error.message });
        res.json(resultados.rows);
    });
};

module.exports = { listar, obtenerPorId, crear, unirse, participantes, eliminar, partidosDeSala };