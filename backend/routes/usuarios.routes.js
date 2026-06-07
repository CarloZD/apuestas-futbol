const express = require('express');
const router = express.Router();
const { porSala } = require('../controllers/ranking.controller');
const { verificarToken } = require('../middleware/auth.middleware');

router.get('/:salaId', verificarToken, porSala);

module.exports = router;