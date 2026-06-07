const conexion = require('../config/database');

const listar = (req, res) => {
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
};

const misPredicciones = (req, res) => {
    const usuarioId = req.usuario.id;
    const sql = `
        SELECT
            p.id,
            pa.id AS partido_id,
            el.nombre AS equipo_local,
            ev.nombre AS equipo_visitante,
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
        WHERE p.usuario_id = ?
        ORDER BY pa.fecha_partido DESC
    `;
    conexion.query(sql, [usuarioId], (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
};

const crear = (req, res) => {
    const usuarioId = req.usuario.id;
    const { sala_id, partido_id, goles_local_pred, goles_visitante_pred } = req.body;

    if (!sala_id || !partido_id || goles_local_pred === undefined || goles_visitante_pred === undefined) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    conexion.query('SELECT * FROM partido WHERE id = ?', [partido_id], (error, partidos) => {
        if (error) return res.status(500).json(error);
        if (partidos.length === 0) return res.status(404).json({ mensaje: 'Partido no encontrado' });

        const partido = partidos[0];
        if (partido.estado !== 'PENDIENTE') {
            return res.status(400).json({ mensaje: 'No se puede predecir un partido que ya inició o finalizó' });
        }

        conexion.query(
            `INSERT INTO prediccion (usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred)
             VALUES (?, ?, ?, ?, ?)`,
            [usuarioId, sala_id, partido_id, goles_local_pred, goles_visitante_pred],
            (error, resultado) => {
                if (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({ mensaje: 'Ya registraste una predicción para este partido en esta sala' });
                    }
                    return res.status(500).json(error);
                }
                res.status(201).json({ mensaje: 'Predicción registrada', id: resultado.insertId });
            }
        );
    });
};

const calcularRacha = (req, res) => {
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
};

module.exports = { listar, misPredicciones, crear, calcularRacha };