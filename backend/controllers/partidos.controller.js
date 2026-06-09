const conexion = require('../config/database');

// Lógica de cálculo de puntos base
function calcularPuntos(predLocal, predVisitante, realLocal, realVisitante) {
    if (predLocal === realLocal && predVisitante === realVisitante) {
        return 5; // Acierto exacto
    }

    let puntos = 0;
    const ganadorPred = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
    const ganadorReal = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';

    if (ganadorPred === ganadorReal) {
        puntos += 3; // Ganador correcto

        const diferenciaPred = predLocal - predVisitante;
        const diferenciaReal = realLocal - realVisitante;
        if (diferenciaPred === diferenciaReal) {
            puntos += 2; // Diferencia de goles correcta
        }
    }

    return puntos;
}

// Función auxiliar para comprobar si se acertó (ganador o exacto)
function esPrediccionAcertada(predLocal, predVisitante, realLocal, realVisitante) {
    if (predLocal === realLocal && predVisitante === realVisitante) return true;
    const ganadorPred = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
    const ganadorReal = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
    return ganadorPred === ganadorReal;
}

const listar = (req, res) => {
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
            p.goles_visitante
        FROM partido p
        INNER JOIN equipo el ON p.equipo_local_id = el.id
        INNER JOIN equipo ev ON p.equipo_visitante_id = ev.id
        ORDER BY p.fecha_partido ASC
    `;
    conexion.query(sql, (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al listar partidos', detalles: error.message });
        res.json(resultados.rows);
    });
};

const obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    const sql = `
        SELECT
            p.id,
            p.codigo_api,
            el.id AS equipo_local_id,
            el.nombre AS equipo_local,
            el.bandera_url AS bandera_local,
            ev.id AS equipo_visitante_id,
            ev.nombre AS equipo_visitante,
            ev.bandera_url AS bandera_visitante,
            p.fecha_partido,
            p.estado,
            p.goles_local,
            p.goles_visitante,
            p.fecha_resultado
        FROM partido p
        INNER JOIN equipo el ON p.equipo_local_id = el.id
        INNER JOIN equipo ev ON p.equipo_visitante_id = ev.id
        WHERE p.id = $1
    `;
    conexion.query(sql, [id], (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener partido', detalles: error.message });
        if (resultados.rows.length === 0) return res.status(404).json({ mensaje: 'Partido no encontrado' });
        res.json(resultados.rows[0]);
    });
};

const crear = (req, res) => {
    const { equipo_local_id, equipo_visitante_id, fecha_partido, codigo_api } = req.body;

    if (!equipo_local_id || !equipo_visitante_id || !fecha_partido) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    if (parseInt(equipo_local_id) === parseInt(equipo_visitante_id)) {
        return res.status(400).json({ mensaje: 'Un equipo no puede jugar contra sí mismo' });
    }

    conexion.query(
        `INSERT INTO partido (equipo_local_id, equipo_visitante_id, fecha_partido, codigo_api) VALUES ($1, $2, $3, $4) RETURNING id`,
        [equipo_local_id, equipo_visitante_id, fecha_partido, codigo_api || null],
        (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al crear partido', detalles: error.message });
            res.status(201).json({ mensaje: 'Partido creado', id: resultado.rows[0].id });
        }
    );
};

const registrarResultado = (req, res) => {
    const id = parseInt(req.params.id);
    const { goles_local, goles_visitante } = req.body;

    if (goles_local === undefined || goles_visitante === undefined) {
        return res.status(400).json({ mensaje: 'Faltan los goles' });
    }

    conexion.query(
        `UPDATE partido
         SET goles_local = $1, goles_visitante = $2, estado = 'FINALIZADO', fecha_resultado = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [parseInt(goles_local), parseInt(goles_visitante), id],
        (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al registrar resultado', detalles: error.message });
            if (resultado.rowCount === 0) return res.status(404).json({ mensaje: 'Partido no encontrado' });

            // Ejecutar el cálculo automático de predicciones para este partido
            calcularPuntajesInterno(id, (err, count) => {
                if (err) {
                    console.error('Error al calcular puntajes tras resultado:', err);
                    return res.json({ mensaje: 'Resultado registrado pero falló el cálculo de puntos', detalles: err.message });
                }
                res.json({ mensaje: 'Resultado registrado y puntajes recalculados', predicciones_procesadas: count });
            });
        }
    );
};

const calcularPuntajes = (req, res) => {
    const partidoId = parseInt(req.params.id);
    calcularPuntajesInterno(partidoId, (err, count) => {
        if (err) return res.status(500).json({ mensaje: 'Error al calcular puntajes', detalles: err.message });
        res.json({ mensaje: 'Puntajes calculados correctamente', predicciones_procesadas: count });
    });
};

// Lógica interna para calcular puntajes de un partido, actualizar racha de usuarios y rankings de salas
function calcularPuntajesInterno(partidoId, callback) {
    conexion.query('SELECT * FROM partido WHERE id = $1', [partidoId], (error, partidos) => {
        if (error) return callback(error);
        if (partidos.rows.length === 0) return callback(new Error('Partido no encontrado'));

        const partido = partidos.rows[0];
        if (partido.estado !== 'FINALIZADO') {
            return callback(new Error('El partido aún no ha finalizado'));
        }

        // Obtener predicciones vinculadas al partido
        conexion.query(
            `SELECT pr.*, pa.fecha_partido
             FROM prediccion pr
             INNER JOIN partido pa ON pr.partido_id = pa.id
             WHERE pr.partido_id = $1`,
            [partidoId],
            (error, predicciones) => {
                if (error) return callback(error);
                if (predicciones.rows.length === 0) {
                    return callback(null, 0); // No hay predicciones para este partido
                }

                let completados = 0;
                const total = predicciones.rows.length;

                predicciones.rows.forEach(pred => {
                    const puntosBase = calcularPuntos(
                        pred.goles_local_pred, pred.goles_visitante_pred,
                        partido.goles_local, partido.goles_visitante
                    );

                    // Predicción anticipada: más de 24 horas antes del partido
                    // fecha_partido - fecha_prediccion
                    const msDiferencia = new Date(partido.fecha_partido).getTime() - new Date(pred.fecha_prediccion).getTime();
                    const horasAnticipacion = msDiferencia / (1000 * 60 * 60);
                    const bonusAnticipacion = horasAnticipacion > 24 ? 1 : 0;

                    const acierto = esPrediccionAcertada(
                        pred.goles_local_pred, pred.goles_visitante_pred,
                        partido.goles_local, partido.goles_visitante
                    ) ? 1 : 0;

                    // Actualizar esta predicción con puntos base, anticipación y acierto
                    conexion.query(
                        `UPDATE prediccion
                         SET puntos_base = $1, bonus_anticipacion = $2, acierto_ganador = $3,
                             puntos_totales = $1 + $2 + bonus_racha
                         WHERE id = $4`,
                        [puntosBase, bonusAnticipacion, acierto, pred.id],
                        (err) => {
                            if (err) {
                                console.error('Error al actualizar predicción:', err);
                            }

                            // Calcular racha para el usuario en la sala específica
                            actualizarRachaYRanking(pred.usuario_id, pred.sala_id, () => {
                                completados++;
                                if (completados === total) {
                                    callback(null, total);
                                }
                            });
                        }
                    );
                });
            }
        );
    });
}

// Función para recalcular la racha cronológica de un usuario en una sala y actualizar su ranking
function actualizarRachaYRanking(usuarioId, salaId, done) {
    // 1. Obtener todas las predicciones del usuario en esa sala en orden cronológico del partido
    const sqlPreds = `
        SELECT p.id, p.goles_local_pred, p.goles_visitante_pred, p.puntos_base, p.bonus_anticipacion,
               pa.goles_local, pa.goles_visitante, pa.estado
        FROM prediccion p
        INNER JOIN partido pa ON p.partido_id = pa.id
        WHERE p.usuario_id = $1 AND p.sala_id = $2 AND pa.estado = 'FINALIZADO'
        ORDER BY pa.fecha_partido ASC
    `;

    conexion.query(sqlPreds, [usuarioId, salaId], (err, resPreds) => {
        if (err) {
            console.error('Error al obtener predicciones para racha:', err);
            return done();
        }

        let racha = 0;
        let updates = [];

        resPreds.rows.forEach(pred => {
            const acierto = esPrediccionAcertada(
                pred.goles_local_pred, pred.goles_visitante_pred,
                pred.goles_local, pred.goles_visitante
            );

            if (acierto) {
                racha++;
                // Si la racha es >= 3, recibe 2 puntos extras por racha
                const bonusRacha = racha >= 3 ? 2 : 0;
                updates.push({
                    id: pred.id,
                    bonus_racha: bonusRacha,
                    puntos_totales: pred.puntos_base + pred.bonus_anticipacion + bonusRacha
                });
            } else {
                racha = 0; // Se corta la racha
                updates.push({
                    id: pred.id,
                    bonus_racha: 0,
                    puntos_totales: pred.puntos_base + pred.bonus_anticipacion
                });
            }
        });

        // Ejecutar las actualizaciones de racha de forma secuencial o simultánea
        let updatesCompletados = 0;
        if (updates.length === 0) {
            actualizarFilaRanking(usuarioId, salaId, done);
        } else {
            updates.forEach(up => {
                conexion.query(
                    `UPDATE prediccion
                     SET bonus_racha = $1, puntos_totales = $2
                     WHERE id = $3`,
                    [up.bonus_racha, up.puntos_totales, up.id],
                    () => {
                        updatesCompletados++;
                        if (updatesCompletados === updates.length) {
                            actualizarFilaRanking(usuarioId, salaId, done);
                        }
                    }
                );
            });
        }
    });
}

// Actualiza los agregados en la tabla ranking para un usuario en una sala
function actualizarFilaRanking(usuarioId, salaId, done) {
    const sqlSuma = `
        SELECT
            SUM(p.puntos_totales) AS puntos_totales,
            SUM(CASE WHEN p.puntos_base = 5 THEN 1 ELSE 0 END) AS aciertos_exactos,
            SUM(CASE WHEN p.acierto_ganador = 1 THEN 1 ELSE 0 END) AS aciertos_ganador
        FROM prediccion p
        INNER JOIN partido pa ON p.partido_id = pa.id
        WHERE p.usuario_id = $1 AND p.sala_id = $2 AND pa.estado = 'FINALIZADO'
    `;

    conexion.query(sqlSuma, [usuarioId, salaId], (err, resSuma) => {
        if (err || resSuma.rows.length === 0) {
            console.error('Error al calcular suma de puntos para ranking:', err);
            return done();
        }

        const data = resSuma.rows[0];
        const puntos = parseInt(data.puntos_totales || 0);
        const exactos = parseInt(data.aciertos_exactos || 0);
        const ganadores = parseInt(data.aciertos_ganador || 0);

        // Actualizar o insertar fila de ranking
        const sqlUpsert = `
            INSERT INTO ranking (sala_id, usuario_id, puntos_acumulados, aciertos_exactos, aciertos_ganador, ultima_actualizacion)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (sala_id, usuario_id) DO UPDATE
            SET puntos_acumulados = EXCLUDED.puntos_acumulados,
                aciertos_exactos = EXCLUDED.aciertos_exactos,
                aciertos_ganador = EXCLUDED.aciertos_ganador,
                ultima_actualizacion = CURRENT_TIMESTAMP
        `;

        conexion.query(sqlUpsert, [salaId, usuarioId, puntos, exactos, ganadores], (err2) => {
            if (err2) {
                console.error('Error al actualizar tabla de ranking:', err2);
            }
            done();
        });
    });
}

module.exports = { listar, obtenerPorId, crear, registrarResultado, calcularPuntajes, calcularPuntos, actualizarRachaYRanking };