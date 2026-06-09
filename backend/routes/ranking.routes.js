const express = require('express');
const router = express.Router();
const { porSala } = require('../controllers/ranking.controller');
const { verificarToken } = require('../middleware/auth.middleware');

/* RANKING POR SALA */
router.get('/:salaId', verificarToken, porSala);

module.exports = router;