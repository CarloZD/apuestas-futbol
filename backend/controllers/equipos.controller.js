const conexion = require('../config/database');

const listar = (req, res) => {
    conexion.query('SELECT * FROM equipo', (error, resultados) => {
        if (error) return res.status(500).json(error);
        res.json(resultados);
    });
};

const crear = (req, res) => {
    const { nombre, codigo_fifa, bandera_url } = req.body;

    if (!nombre || !codigo_fifa) {
        return res.status(400).json({ mensaje: 'Faltan campos requeridos' });
    }

    conexion.query(
        'INSERT INTO equipo (nombre, codigo_fifa, bandera_url) VALUES (?, ?, ?)',
        [nombre, codigo_fifa, bandera_url],
        (error, resultado) => {
            if (error) return res.status(500).json(error);
            res.status(201).json({ mensaje: 'Equipo creado', id: resultado.insertId });
        }
    );
};

module.exports = { listar, crear };