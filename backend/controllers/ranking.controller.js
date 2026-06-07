const conexion = require('../config/database');

const porSala = (req, res) => {
    const salaId = req.params.salaId;
    const sql = `
        SELECT
            u.id,
            u.nombre,
            SUM(p.puntos_totales) AS puntos,
            COUNT(p.id) AS total_predicciones,
            SUM(CASE WHEN p.acierto_ganador = 1 THEN 1 ELSE 0 END) AS aciertos_ganador,
            SUM(CASE WHEN p.goles_local_pred = pa.goles_local 
                      AND p.goles_visitante_pred = pa.goles_visitante 
                      AND pa.estado = 'FINALIZADO' THEN 1 ELSE 0 END) AS aciertos_exactos
        FROM prediccion p
        INNER JOIN usuario u ON p.usuario_id = u.id
        INNER JOIN partido pa ON p.partido_id = pa.id
        WHERE p.sala_id = ?
        GROUP BY u.id, u.nombre
        ORDER BY puntos DESC
    `;
    conexion.query(sql, [salaId], (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
};

module.exports = { porSala };