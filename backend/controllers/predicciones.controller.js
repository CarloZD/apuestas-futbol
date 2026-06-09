const conexion = require('../config/database');
const { actualizarRachaYRanking } = require('./partidos.controller');

const listar = (req, res) => {
    const sql = `
        SELECT
            p.id,
            u.nombre AS usuario,
            p.sala_id,
            p.partido_id AS partido,
            p.goles_local_pred,
            p.goles_visitante_pred,
            p.bonus_anticipacion,
            p.bonus_racha,
            p.puntos_totales
        FROM prediccion p
        INNER JOIN usuario u ON p.usuario_id = u.id
        ORDER BY p.fecha_prediccion DESC
    `;
    conexion.query(sql, (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al listar predicciones', detalles: error.message });
        res.json(resultados.rows);
    });
};

const misPredicciones = (req, res) => {
    const usuarioId = req.usuario.id;
    const sql = `
        SELECT
            p.id,
            p.sala_id,
            s.nombre AS sala_nombre,
            pa.id AS partido_id,
            el.nombre AS equipo_local,
            el.bandera_url AS bandera_local,
            ev.nombre AS equipo_visitante,
            ev.bandera_url AS bandera_visitante,
            pa.fecha_partido,
            pa.estado,
            pa.goles_local,
            pa.goles_visitante,
            p.goles_local_pred,
            p.goles_visitante_pred,
            p.bonus_anticipacion,
            p.bonus_racha,
            p.puntos_totales,
            p.acierto_ganador
        FROM prediccion p
        INNER JOIN partido pa ON p.partido_id = pa.id
        INNER JOIN equipo el ON pa.equipo_local_id = el.id
        INNER JOIN equipo ev ON pa.equipo_visitante_id = ev.id
        INNER JOIN sala s ON p.sala_id = s.id
        WHERE p.usuario_id = $1
        ORDER BY pa.fecha_partido DESC
    `;
    conexion.query(sql, [usuarioId], (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener tus predicciones', detalles: error.message });
        res.json(resultados.rows);
    });
};

const crear = (req, res) => {
    const usuarioId = req.usuario.id;
    const { sala_id, partido_id, goles_local_pred, goles_visitante_pred } = req.body;

    if (!sala_id || !partido_id || goles_local_pred === undefined || goles_visitante_pred === undefined) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    // 1. Verificar que el partido esté habilitado para esta sala
    conexion.query(
        'SELECT 1 FROM sala_partido WHERE sala_id = $1 AND partido_id = $2',
        [parseInt(sala_id), parseInt(partido_id)],
        (error, checkSala) => {
            if (error) return res.status(500).json({ mensaje: 'Error al verificar sala', detalles: error.message });
            if (checkSala.rows.length === 0) {
                return res.status(400).json({ mensaje: 'Este partido no está habilitado para ser predicho en esta sala' });
            }

            // 2. Verificar que el partido no haya comenzado
            conexion.query('SELECT * FROM partido WHERE id = $1', [parseInt(partido_id)], (error2, partidos) => {
                if (error2) return res.status(500).json({ mensaje: 'Error al buscar partido', detalles: error2.message });
                if (partidos.rows.length === 0) return res.status(404).json({ mensaje: 'Partido no encontrado' });

                const partido = partidos.rows[0];
                if (partido.estado !== 'PENDIENTE') {
                    return res.status(400).json({ mensaje: 'No se puede predecir un partido que ya inició, finalizó o fue cancelado' });
                }

                const ahora = new Date();
                const fechaPartido = new Date(partido.fecha_partido);

                if (ahora >= fechaPartido) {
                    return res.status(400).json({ mensaje: 'El partido ya ha comenzado según la hora programada' });
                }

                // 3. Calcular bono de anticipación (> 24h antes del partido)
                const msDiferencia = fechaPartido.getTime() - ahora.getTime();
                const horasAnticipacion = msDiferencia / (1000 * 60 * 60);
                const bonusAnticipacion = horasAnticipacion > 24 ? 1 : 0;

                // 4. Registrar o actualizar la predicción (usando ON CONFLICT para PostgreSQL)
                const sqlUpsert = `
                    INSERT INTO prediccion (usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred, bonus_anticipacion, puntos_totales, fecha_prediccion)
                    VALUES ($1, $2, $3, $4, $5, $6, $6, CURRENT_TIMESTAMP)
                    ON CONFLICT (usuario_id, sala_id, partido_id) DO UPDATE
                    SET goles_local_pred = EXCLUDED.goles_local_pred,
                        goles_visitante_pred = EXCLUDED.goles_visitante_pred,
                        bonus_anticipacion = EXCLUDED.bonus_anticipacion,
                        puntos_totales = EXCLUDED.bonus_anticipacion,
                        fecha_prediccion = CURRENT_TIMESTAMP
                    RETURNING id
                `;

                conexion.query(
                    sqlUpsert,
                    [usuarioId, parseInt(sala_id), parseInt(partido_id), parseInt(goles_local_pred), parseInt(goles_visitante_pred), bonusAnticipacion],
                    (error3, resultado) => {
                        if (error3) return res.status(500).json({ mensaje: 'Error al registrar predicción', detalles: error3.message });
                        res.status(201).json({ mensaje: 'Predicción registrada con éxito', id: resultado.rows[0].id });
                    }
                );
            });
        }
    );
};

const calcularRacha = (req, res) => {
    const usuarioId = parseInt(req.params.usuarioId);
    
    // Obtener todas las salas a las que pertenece el usuario
    conexion.query(
        'SELECT sala_id FROM miembro_sala WHERE usuario_id = $1',
        [usuarioId],
        (error, miembroSalas) => {
            if (error) return res.status(500).json({ mensaje: 'Error al buscar salas del usuario', detalles: error.message });
            
            if (miembroSalas.rows.length === 0) {
                return res.json({ mensaje: 'El usuario no pertenece a ninguna sala', actualizado: 0 });
            }

            let completados = 0;
            const salas = miembroSalas.rows;

            salas.forEach(ms => {
                actualizarRachaYRanking(usuarioId, ms.sala_id, () => {
                    completados++;
                    if (completados === salas.length) {
                        res.json({ mensaje: 'Racha calculada para todas las salas del usuario', salas_actualizadas: salas.length });
                    }
                });
            });
        }
    );
};

module.exports = { listar, misPredicciones, crear, calcularRacha };