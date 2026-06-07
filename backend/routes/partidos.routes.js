const express = require('express');
const router = express.Router();
const { listar, obtenerPorId, crear, registrarResultado, calcularPuntajes } = require('../controllers/partidos.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtenerPorId);
router.post('/', verificarToken, soloAdmin, crear);
router.put('/:id/resultado', verificarToken, soloAdmin, registrarResultado);
router.post('/:id/calcular', verificarToken, soloAdmin, calcularPuntajes);

module.exports = router;