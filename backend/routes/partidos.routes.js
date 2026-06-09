const express = require('express');
const router = express.Router();
const { listar, obtenerPorId, crear, registrarResultado, calcularPuntajes } = require('../controllers/partidos.controller');
const { verificarToken, soloAdmin } = require('../middleware/auth.middleware');
const { syncMatches } = require('../services/sync.service');

router.get('/', verificarToken, listar);
router.get('/:id', verificarToken, obtenerPorId);
router.post('/sync', verificarToken, soloAdmin, async (req, res) => {
    try {
        const count = await syncMatches();
        res.json({ mensaje: 'Sincronización exitosa', partidos_sincronizados: count });
    } catch (err) {
        res.status(500).json({ mensaje: 'Error al sincronizar con Zafronix API', detalles: err.message });
    }
});
router.post('/', verificarToken, soloAdmin, crear);
router.put('/:id/resultado', verificarToken, soloAdmin, registrarResultado);
router.post('/:id/calcular', verificarToken, soloAdmin, calcularPuntajes);

module.exports = router;