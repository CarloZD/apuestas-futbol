const conexion = require('../config/database');

const porSala = (req, res) => {
    const salaId = parseInt(req.params.salaId);
    
    const sql = `
        SELECT
            u.id,
            u.nombre,
            u.correo,
            COALESCE(r.puntos_acumulados, 0) AS puntos,
            COALESCE(r.aciertos_exactos, 0) AS aciertos_exactos,
            COALESCE(r.aciertos_ganador, 0) AS aciertos_ganador,
            COALESCE(
                (SELECT COUNT(*) FROM miembro_sala pr WHERE pr.usuario_id = u.id AND pr.sala_id = ms.sala_id), 0
            ) AS es_miembro,
            COALESCE(
                (SELECT COUNT(*) FROM prediccion pr WHERE pr.usuario_id = u.id AND pr.sala_id = ms.sala_id), 0
            ) AS total_predicciones
        FROM miembro_sala ms
        INNER JOIN usuario u ON ms.usuario_id = u.id
        LEFT JOIN ranking r ON ms.sala_id = r.sala_id AND ms.usuario_id = r.usuario_id
        WHERE ms.sala_id = $1
        ORDER BY puntos DESC, aciertos_exactos DESC, aciertos_ganador DESC, u.nombre ASC
    `;
    
    conexion.query(sql, [salaId], async (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al obtener ranking', detalles: error.message });
        
        const rankingRows = resultados.rows;
        
        // Calcular la racha actual activa para cada participante de la sala
        const promises = rankingRows.map(row => {
            return new Promise((resolve) => {
                const streakSql = `
                    SELECT p.goles_local_pred, p.goles_visitante_pred, pa.goles_local, pa.goles_visitante
                    FROM prediccion p
                    INNER JOIN partido pa ON p.partido_id = pa.id
                    WHERE p.usuario_id = $1 AND p.sala_id = $2 AND pa.estado = 'FINALIZADO'
                    ORDER BY pa.fecha_partido DESC
                `;
                conexion.query(streakSql, [row.id, salaId], (err, streakRes) => {
                    if (err) {
                        row.racha_actual = 0;
                        return resolve();
                    }
                    
                    let streak = 0;
                    for (const pred of streakRes.rows) {
                        const isExact = pred.goles_local_pred === pred.goles_local && pred.goles_visitante_pred === pred.goles_visitante;
                        const gPred = pred.goles_local_pred > pred.goles_visitante_pred ? 'L' : pred.goles_local_pred < pred.goles_visitante_pred ? 'V' : 'E';
                        const gReal = pred.goles_local > pred.goles_visitante ? 'L' : pred.goles_local < pred.goles_visitante ? 'V' : 'E';
                        const isWinner = gPred === gReal;
                        
                        if (isExact || isWinner) {
                            streak++;
                        } else {
                            break;
                        }
                    }
                    row.racha_actual = streak;
                    resolve();
                });
            });
        });
        
        await Promise.all(promises);
        res.json(rankingRows);
    });
};

module.exports = { porSala };