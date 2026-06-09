const conexion = require('../config/database');

const listar = (req, res) => {
    conexion.query('SELECT * FROM equipo ORDER BY nombre ASC', (error, resultados) => {
        if (error) return res.status(500).json({ mensaje: 'Error al listar equipos', detalles: error.message });
        res.json(resultados.rows);
    });
};

const crear = (req, res) => {
    const { nombre, codigo_fifa, bandera_url } = req.body;

    if (!nombre || !codigo_fifa) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    conexion.query(
        'INSERT INTO equipo (nombre, codigo_fifa, bandera_url) VALUES ($1, $2, $3) RETURNING id',
        [nombre, codigo_fifa, bandera_url],
        (error, resultado) => {
            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ mensaje: 'El código FIFA ya está registrado' });
                }
                return res.status(500).json({ mensaje: 'Error al crear equipo', detalles: error.message });
            }
            res.status(201).json({ mensaje: 'Equipo creado', id: resultado.rows[0].id });
        }
    );
};

module.exports = { listar, crear };