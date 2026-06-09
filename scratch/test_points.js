const { Pool } = require('../backend/node_modules/pg');

const passwords = ['root', 'postgres', 'admin', '123456', '', 'postgreSQL'];

async function tryConnect() {
    for (const pwd of passwords) {
        console.log(`Intentando conectar con contraseña: "${pwd}"`);
        const pool = new Pool({
            host: 'localhost',
            user: 'postgres',
            password: pwd,
            database: 'bd_mundial_predicciones',
            port: 5432,
            connectionTimeoutMillis: 1000
        });

        try {
            const client = await pool.connect();
            console.log(`¡Conectado exitosamente con contraseña: "${pwd}"!`);
            
            const resPred = await client.query('SELECT * FROM prediccion');
            console.log('--- PREDICCIONES ---');
            console.log(resPred.rows);

            const resPartidos = await client.query('SELECT * FROM partido');
            console.log('--- PARTIDOS ---');
            console.log(resPartidos.rows);

            const resUsers = await client.query('SELECT * FROM usuario');
            console.log('--- USUARIOS ---');
            console.log(resUsers.rows);

            client.release();
            pool.end();
            return;
        } catch (err) {
            console.log(`Fallo con "${pwd}": ${err.message}`);
            pool.end();
        }
    }
}

tryConnect();
