const conexion = require('../config/database');

const perfil = (req, res) => {
    const id = req.usuario.id;
    conexion.query(
        'SELECT id, nombre, correo, rol, fecha_registro FROM usuario WHERE id = ?',
        [id],
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            if (resultados.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json(resultados[0]);
        }
    );
};

const listar = (req, res) => {
    conexion.query(
        'SELECT id, nombre, correo, rol, activo, fecha_registro FROM usuario',
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            res.json(resultados);
        }
    );
};

const obtenerPorId = (req, res) => {
    const id = req.params.id;
    conexion.query(
        'SELECT id, nombre, correo, rol, activo, fecha_registro FROM usuario WHERE id = ?',
        [id],
        (error, resultados) => {
            if (error) return res.status(500).json(error);
            if (resultados.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json(resultados[0]);
        }
    );
};

const actualizar = (req, res) => {
    const id = req.params.id;
    const { nombre, correo, rol, activo } = req.body;

    conexion.query(
        `UPDATE usuario SET nombre=?, correo=?, rol=?, activo=? WHERE id=?`,
        [nombre, correo, rol, activo, id],
        (error, resultado) => {
            if (error) return res.status(500).json(error);
            if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json({ mensaje: 'Usuario actualizado' });
        }
    );
};

const eliminar = (req, res) => {
    const id = req.params.id;
    conexion.query(
        'UPDATE usuario SET activo = 0 WHERE id = ?',
        [id],
        (error, resultado) => {
            if (error) return res.status(500).json(error);
            if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            res.json({ mensaje: 'Usuario desactivado' });
        }
    );
};

module.exports = { perfil, listar, obtenerPorId, actualizar, eliminar };