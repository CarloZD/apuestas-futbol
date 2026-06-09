const express = require('express');
const router = express.Router();
const { perfil, listar, obtenerPorId, actualizar, eliminar } = require('../controllers/usuarios.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

router.get('/perfil', verificarToken, perfil);
router.get('/', verificarToken, soloAdmin, listar);
router.get('/:id', verificarToken, soloAdmin, obtenerPorId);
router.put('/:id', verificarToken, actualizar);
router.delete('/:id', verificarToken, soloAdmin, eliminar);

module.exports = router;