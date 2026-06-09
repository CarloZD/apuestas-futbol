const conexion = require('../config/database');

const perfil = (req, res) => {
    const id = req.usuario.id;
    conexion.query(
        'SELECT id, nombre, correo, rol, fecha_registro FROM usuario WHERE id = $1',
        [id],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener perfil', detalles: error.message });
            if (resultados.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json(resultados.rows[0]);
        }
    );
};

const listar = (req, res) => {
    conexion.query(
        'SELECT id, nombre, correo, rol, activo, fecha_registro FROM usuario ORDER BY nombre ASC',
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al listar usuarios', detalles: error.message });
            res.json(resultados.rows);
        }
    );
};

const obtenerPorId = (req, res) => {
    const id = parseInt(req.params.id);
    conexion.query(
        'SELECT id, nombre, correo, rol, activo, fecha_registro FROM usuario WHERE id = $1',
        [id],
        (error, resultados) => {
            if (error) return res.status(500).json({ mensaje: 'Error al obtener usuario', detalles: error.message });
            if (resultados.rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json(resultados.rows[0]);
        }
    );
};

const actualizar = (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, correo, rol, activo } = req.body;

    conexion.query(
        `UPDATE usuario SET nombre=$1, correo=$2, rol=$3, activo=$4 WHERE id=$5`,
        [nombre, correo, rol, activo, id],
        (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al actualizar usuario', detalles: error.message });
            if (resultado.rowCount === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json({ mensaje: 'Usuario actualizado' });
        }
    );
};

const eliminar = (req, res) => {
    const id = parseInt(req.params.id);
    conexion.query(
        'UPDATE usuario SET activo = FALSE WHERE id = $1',
        [id],
        (error, resultado) => {
            if (error) return res.status(500).json({ mensaje: 'Error al desactivar usuario', detalles: error.message });
            if (resultado.rowCount === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json({ mensaje: 'Usuario desactivado' });
        }
    );
};

module.exports = { perfil, listar, obtenerPorId, actualizar, eliminar };