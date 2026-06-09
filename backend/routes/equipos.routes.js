const express = require('express');
const router = express.Router();
const { listar, crear } = require('../controllers/equipos.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');

router.get('/', verificarToken, listar);
router.post('/', verificarToken, soloAdmin, crear);

module.exports = router;