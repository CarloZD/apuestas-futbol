const express = require('express');
const router = express.Router();

const conexion = require('../config/database');

/* LISTAR TODOS */
router.get('/', (req, res) => {

    conexion.query(
        'SELECT * FROM usuario',
        (error, resultados) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json(resultados);
        }
    );

});

/* BUSCAR POR ID */
router.get('/:id', (req, res) => {

    const id = req.params.id;

    conexion.query(
        'SELECT * FROM usuario WHERE id = ?',
        [id],
        (error, resultados) => {

            if (error) {
                return res.status(500).json(error);
            }

            if (resultados.length === 0) {
                return res.status(404).json({
                    mensaje: 'Usuario no encontrado'
                });
            }

            res.json(resultados[0]);
        }
    );

});

/* REGISTRAR */
router.post('/', (req, res) => {

    const { nombre, correo, password, rol } = req.body;

    conexion.query(
        `INSERT INTO usuario
        (nombre, correo, password, rol)
        VALUES (?, ?, ?, ?)`,
        [nombre, correo, password, rol],
        (error, resultado) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json({
                mensaje: 'Usuario registrado',
                id: resultado.insertId
            });
        }
    );

});

/* ACTUALIZAR */
router.put('/:id', (req, res) => {

    const id = req.params.id;

    const {
        nombre,
        correo,
        password,
        rol
    } = req.body;

    conexion.query(
        `UPDATE usuario
         SET nombre=?,
             correo=?,
             password=?,
             rol=?
         WHERE id=?`,
        [nombre, correo, password, rol, id],
        (error) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json({
                mensaje: 'Usuario actualizado'
            });
        }
    );

});

/* ELIMINAR */
router.delete('/:id', (req, res) => {

    const id = req.params.id;

    conexion.query(
        'DELETE FROM usuario WHERE id=?',
        [id],
        (error) => {

            if (error) {
                return res.status(500).json(error);
            }

            res.json({
                mensaje: 'Usuario eliminado'
            });
        }
    );

});

module.exports = router;