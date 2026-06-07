const express = require('express');
const router = express.Router();
const { listar, misPredicciones, crear, calcularRacha } = require('../controllers/predicciones.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/mis-predicciones', verificarToken, misPredicciones);
router.post('/', verificarToken, crear);
router.post('/racha/:usuarioId', verificarToken, calcularRacha);

module.exports = router;