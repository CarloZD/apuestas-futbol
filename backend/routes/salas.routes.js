const express = require('express');
const router = express.Router();
const { listar, obtenerPorId, crear, unirse, participantes, eliminar, partidosDeSala } = require('../controllers/salas.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtenerPorId);
router.get('/:id/partidos', verificarToken, partidosDeSala);
router.post('/', verificarToken, crear);
router.post('/unirse', verificarToken, unirse);
router.get('/:id/participantes', verificarToken, participantes);
router.delete('/:id', verificarToken, eliminar);

module.exports = router;