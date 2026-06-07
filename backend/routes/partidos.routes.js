const express = require('express');
const router = express.Router();
const conexion = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

function calcularPuntos(predLocal, predVisitante, realLocal, realVisitante) {
    if (predLocal === realLocal && predVisitante === realVisitante) return 5;

    const ganadorPred = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
    const ganadorReal = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';

    if (ganadorPred === ganadorReal) return 3;

    const diferenciaPred = predLocal - predVisitante;
    const diferenciaReal = realLocal - realVisitante;

    if (diferenciaPred === diferenciaReal) return 2;

    return 0;
}

function acertoGanador(predLocal, predVisitante, realLocal, realVisitante) {
    const ganadorPred = predLocal > predVisitante ? 'L' : predLocal < predVisitante ? 'V' : 'E';
    const ganadorReal = realLocal > realVisitante ? 'L' : realLocal < realVisitante ? 'V' : 'E';
    return ganadorPred === ganadorReal;
}

/* LISTAR PARTIDOS - usuario logueado */
router.get('/', verificarToken, (req, res) => {
    const sql = `
        SELECT
            p.id,
            el.nombre AS equipo_local,
            ev.nombre AS equipo_visitante,
            p.fecha_partido,
            p.estado,
            p.goles_local,
            p.goles_visitante
        FROM partido p
        INNER JOIN equipo el ON p.equipo_local_id = el.id
        INNER JOIN equipo ev ON p.equipo_visitante_id = ev.id
    `;
    conexion.query(sql, (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
});

/* CREAR PARTIDO - solo ADMIN */
router.post('/', verificarToken, soloAdmin, (req, res) => {
    const { equipo_local_id, equipo_visitante_id, fecha_partido } = req.body;
    conexion.query(
        `INSERT INTO partido (equipo_local_id, equipo_visitante_id, fecha_partido)
         VALUES (?, ?, ?)`,
        [equipo_local_id, equipo_visitante_id, fecha_partido],
        (error, resultado) => {
            if (error) return res.status(500).json(error);
            res.json({ mensaje: 'Partido creado', id: resultado.insertId });
        }
    );
});

/* REGISTRAR RESULTADO - solo ADMIN */
router.put('/:id/resultado', verificarToken, soloAdmin, (req, res) => {
    const id = req.params.id;
    const { goles_local, goles_visitante } = req.body;
    conexion.query(
        `UPDATE partido
         SET goles_local = ?, goles_visitante = ?, estado = 'FINALIZADO', fecha_resultado = NOW()
         WHERE id = ?`,
        [goles_local, goles_visitante, id],
        (error) => {
            if (error) return res.status(500).json(error);
            res.json({ mensaje: 'Resultado registrado' });
        }
    );
});

/* CALCULAR PUNTAJES - solo ADMIN */
router.post('/:id/calcular', verificarToken, soloAdmin, (req, res) => {
    const partidoId = req.params.id;
    conexion.query(
        'SELECT * FROM partido WHERE id = ?',
        [partidoId],
        (error, partidos) => {
            if (error) return res.status(500).json(error);
            if (partidos.length === 0) return res.status(404).json({ mensaje: 'Partido no encontrado' });

            const partido = partidos[0];

            conexion.query(
                `SELECT pr.*, pa.fecha_partido
                 FROM prediccion pr
                 INNER JOIN partido pa ON pr.partido_id = pa.id
                 WHERE pr.partido_id = ?`,
                [partidoId],
                (error, predicciones) => {
                    if (error) return res.status(500).json(error);

                    predicciones.forEach(pred => {
                        let puntos = calcularPuntos(
                            pred.goles_local_pred, pred.goles_visitante_pred,
                            partido.goles_local, partido.goles_visitante
                        );

                        const horas = (new Date(pred.fecha_partido) - new Date(pred.fecha_prediccion)) / (1000 * 60 * 60);
                        let bonusAnticipacion = horas > 24 ? 1 : 0;
                        puntos += bonusAnticipacion;

                        const acierto = acertoGanador(
                            pred.goles_local_pred, pred.goles_visitante_pred,
                            partido.goles_local, partido.goles_visitante
                        );

                        conexion.query(
                            `UPDATE prediccion
                             SET puntos_totales = ?, bonus_anticipacion = ?, acierto_ganador = ?
                             WHERE id = ?`,
                            [puntos, bonusAnticipacion, acierto, pred.id]
                        );
                    });

                    res.json({ mensaje: 'Puntajes calculados correctamente' });
                }
            );
        }
    );
});

module.exports = router;