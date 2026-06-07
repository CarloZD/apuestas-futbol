const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'mysql',
    user: 'root',
    password: 'root',
    database: 'bd_mundial_predicciones',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((error, connection) => {
    if (error) {
        console.log('Error de conexión:', error.code);
    } else {
        console.log('Conectado a MySQL ✅');
        connection.release();
    }
});

module.exports = pool;