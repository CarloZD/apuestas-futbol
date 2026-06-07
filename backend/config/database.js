const mysql = require('mysql2');

const conexion = mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: '',
    database: 'bd_mundial_predicciones'
});

conexion.connect((error) => {
    if (error) {
        console.log('Error de conexión:', error);
    } else {
        console.log('Conectado a MySQL');
    }
});

module.exports = conexion;