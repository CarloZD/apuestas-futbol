const express = require('express');
const router = express.Router();

const conexion = require('../config/database');

/* LISTAR SALAS */
router.get('/', (req, res) => {

    conexion.query(
        'SELECT * FROM sala',
        (error, resultados) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json(resultados);
        }
    );

});

/* CREAR SALA */
router.post('/', (req, res) => {

    const {
        nombre,
        codigo_invitacion,
        creador_id
    } = req.body;

    conexion.query(
        `INSERT INTO sala
        (nombre, codigo_invitacion, creador_id)
        VALUES (?, ?, ?)`,
        [
            nombre,
            codigo_invitacion,
            creador_id
        ],
        (error, resultado) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json({
                mensaje: 'Sala creada',
                id: resultado.insertId
            });
        }
    );

});
/* UNIRSE A SALA */
router.post('/unirse', (req, res) => {

    const {
        usuario_id,
        codigo_invitacion
    } = req.body;

    conexion.query(
        'SELECT * FROM sala WHERE codigo_invitacion = ?',
        [codigo_invitacion],
        (error, salas) => {

            if (error) {
                return res.status(500).json(error);
            }

            if (salas.length === 0) {
                return res.status(404).json({
                    mensaje: 'Sala no encontrada'
                });
            }

            const sala = salas[0];

            conexion.query(
                `INSERT INTO miembro_sala
                (usuario_id, sala_id)
                VALUES (?, ?)`,
                [usuario_id, sala.id],
                (error) => {

                    if (error) {
                        return res.status(500).json(error);
                    }

                    res.json({
                        mensaje: 'Usuario unido a la sala'
                    });
                }
            );
        }
    );

});

/* VER PARTICIPANTES EN SALA */
router.get('/:id/participantes', (req, res) => {

    const salaId = req.params.id;

    conexion.query(
        `
        SELECT
            u.id,
            u.nombre,
            u.correo
        FROM miembro_sala ms
        INNER JOIN usuario u
            ON ms.usuario_id = u.id
        WHERE ms.sala_id = ?
        `,
        [salaId],
        (error, resultados) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json(resultados);
        }
    );

});

module.exports = router;