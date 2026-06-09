require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const usuariosRoutes = require('./routes/usuarios.routes');
const salasRoutes = require('./routes/salas.routes');
const equiposRoutes = require('./routes/equipos.routes');
const partidosRoutes = require('./routes/partidos.routes');
const prediccionesRoutes = require('./routes/predicciones.routes');
const rankingRoutes = require('./routes/ranking.routes');
const authRoutes = require('./routes/auth.routes');

app.use('/ranking', rankingRoutes);
app.use('/predicciones', prediccionesRoutes);
app.use('/partidos', partidosRoutes);
app.use('/equipos', equiposRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/salas', salasRoutes);
app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor iniciado en puerto ${PORT}`);
});