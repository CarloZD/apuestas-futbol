const pool = require('../backend/config/database');

async function test() {
    try {
        const resPred = await pool.query('SELECT * FROM prediccion');
        console.log('--- PREDICCIONES ---');
        console.log(resPred.rows);

        const resPartidos = await pool.query('SELECT * FROM partido');
        console.log('--- PARTIDOS ---');
        console.log(resPartidos.rows);

        const resUsers = await pool.query('SELECT * FROM usuario');
        console.log('--- USUARIOS ---');
        console.log(resUsers.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

test();
