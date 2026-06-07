const express = require('express');
const router = express.Router();

const conexion = require('../config/database');

/* LISTAR EQUIPOS */
router.get('/', (req, res) => {

    conexion.query(
        'SELECT * FROM equipo',
        (error, resultados) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json(resultados);
        }
    );

});

/* CREAR EQUIPO */
router.post('/', (req, res) => {

    const {
        nombre,
        codigo_fifa,
        bandera_url
    } = req.body;

    conexion.query(
        `INSERT INTO equipo
        (nombre, codigo_fifa, bandera_url)
        VALUES (?, ?, ?)`,
        [
            nombre,
            codigo_fifa,
            bandera_url
        ],
        (error, resultado) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json({
                mensaje: 'Equipo creado',
                id: resultado.insertId
            });
        }
    );

});

module.exports = router;