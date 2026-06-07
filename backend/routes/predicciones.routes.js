const express = require('express');
const router = express.Router();
const conexion = require('../config/database');
const { verificarToken } = require('../middleware/auth.middleware');

/* LISTAR PREDICCIONES - usuario logueado */
router.get('/', verificarToken, (req, res) => {
    const sql = `
        SELECT
            p.id,
            u.nombre AS usuario,
            p.partido_id AS partido,
            p.goles_local_pred,
            p.goles_visitante_pred,
            p.bonus_anticipacion,
            p.bonus_racha,
            p.puntos_totales
        FROM prediccion p
        INNER JOIN usuario u ON p.usuario_id = u.id
    `;
    conexion.query(sql, (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
});

/* CREAR PREDICCION - usuario logueado */
router.post('/', verificarToken, (req, res) => {
    const { usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred } = req.body;
    conexion.query(
        `INSERT INTO prediccion (usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred)
         VALUES (?, ?, ?, ?, ?)`,
        [usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred],
        (error, resultado) => {
            if (error) return res.status(500).json(error);
            res.json({ mensaje: 'Predicción registrada', id: resultado.insertId });
        }
    );
});

/* CALCULAR RACHA - usuario logueado */
router.post('/racha/:usuarioId', verificarToken, (req, res) => {
    const usuarioId = req.params.usuarioId;
    conexion.query(
        'SELECT * FROM prediccion WHERE usuario_id = ? ORDER BY fecha_prediccion ASC',
        [usuarioId],
        (error, predicciones) => {
            if (error) return res.status(500).json(error);

            let consecutivos = 0;
            let bonusTotal = 0;

            predicciones.forEach(pred => {
                if (pred.acierto_ganador == 1) {
                    consecutivos++;
                    if (consecutivos % 3 === 0) {
                        bonusTotal += 2;
                        conexion.query(
                            `UPDATE prediccion
                             SET bonus_racha = 2, puntos_totales = puntos_totales + 2
                             WHERE id = ?`,
                            [pred.id]
                        );
                    }
                } else {
                    consecutivos = 0;
                }
            });

            res.json({ mensaje: 'Racha calculada', bonusTotal });
        }
    );
});

module.exports = router;