const express = require('express');
const router = express.Router();
const conexion = require('../config/database');
const { verificarToken } = require('../middleware/auth.middleware');

/* RANKING POR SALA - usuario logueado */
router.get('/:salaId', verificarToken, (req, res) => {
    const salaId = req.params.salaId;
    const sql = `
        SELECT
            u.id,
            u.nombre,
            SUM(p.puntos_totales) AS puntos
        FROM prediccion p
        INNER JOIN usuario u ON p.usuario_id = u.id
        WHERE p.sala_id = ?
        GROUP BY u.id, u.nombre
        ORDER BY puntos DESC
    `;
    conexion.query(sql, [salaId], (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
});

module.exports = router;