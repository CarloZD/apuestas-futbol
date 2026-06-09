const https = require('https');
const conexion = require('../config/database');
const { actualizarRachaYRanking, calcularPuntos, calcularPuntajes } = require('../controllers/partidos.controller');

const API_KEY = 'zwc_free_d1774e387855b4a9941862ba';

// Helper para realizar llamadas GET seguras
function fetchFromApi(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'X-API-Key': API_KEY
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Error al parsear JSON: ${e.message}. Datos recibidos: ${data.substring(0, 100)}`));
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Sincronizar Equipos
async function syncTeams() {
    console.log('Iniciando sincronización de equipos...');
    try {
        const url = 'https://api.zafronix.com/fifa/worldcup/v1/teams?tournament=2026';
        const teams = await fetchFromApi(url);

        if (!Array.isArray(teams)) {
            throw new Error('La respuesta de equipos no es un arreglo válido');
        }

        let syncedCount = 0;
        for (const team of teams) {
            const nombre = team.name;
            const codigo = team.code;
            const iso = team.iso ? team.iso.toLowerCase() : 'xx';
            const banderaUrl = `https://flagcdn.com/w320/${iso}.png`;

            // Insertar o actualizar equipo por codigo_fifa
            await new Promise((resolve, reject) => {
                const sql = `
                    INSERT INTO equipo (nombre, codigo_fifa, bandera_url)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (codigo_fifa) DO UPDATE
                    SET nombre = EXCLUDED.nombre,
                        bandera_url = EXCLUDED.bandera_url
                `;
                conexion.query(sql, [nombre, codigo, banderaUrl], (err) => {
                    if (err) reject(err);
                    else {
                        syncedCount++;
                        resolve();
                    }
                });
            });
        }
        console.log(`Sincronización de equipos completada: ${syncedCount} equipos.`);
        return syncedCount;
    } catch (err) {
        console.error('Error al sincronizar equipos:', err);
        throw err;
    }
}

// Sincronizar Partidos
async function syncMatches() {
    console.log('Iniciando sincronización de partidos...');
    try {
        // Asegurarse de que los equipos estén sincronizados primero
        await syncTeams();

        const url = 'https://api.zafronix.com/fifa/worldcup/v1/matches?year=2026';
        const response = await fetchFromApi(url);

        const matches = response.data;
        if (!Array.isArray(matches)) {
            throw new Error('La respuesta de partidos no contiene un arreglo data válido');
        }

        // Cargar mapa de equipos (nombre -> id y codigo -> id) para búsquedas rápidas
        const equipoMap = await new Promise((resolve, reject) => {
            conexion.query('SELECT id, nombre, codigo_fifa FROM equipo', (err, res) => {
                if (err) return reject(err);
                const map = {};
                res.rows.forEach(eq => {
                    map[eq.nombre.toLowerCase()] = eq.id;
                    map[eq.codigo_fifa.toLowerCase()] = eq.id;
                });
                resolve(map);
            });
        });

        let syncedCount = 0;
        let finalizadosParaProcesar = []; // guardar ids de partidos finalizados para recalcular predicciones

        for (const match of matches) {
            const codigoApi = match.id;
            const localNombre = match.homeTeam;
            const visitanteNombre = match.awayTeam;
            const fechaPartido = match.kickoffUtc || `${match.date}T${match.kickoff || '12:00'}:00.000Z`;
            
            // Buscar IDs de equipos locales y visitantes
            const equipoLocalId = equipoMap[localNombre.toLowerCase()];
            const equipoVisitanteId = equipoMap[visitanteNombre.toLowerCase()];

            if (!equipoLocalId || !equipoVisitanteId) {
                console.warn(`Saltando partido ${codigoApi}: No se encontraron los equipos (${localNombre} o ${visitanteNombre}) en la base de datos.`);
                continue;
            }

            const golesLocal = match.homeScore !== null && match.homeScore !== undefined ? parseInt(match.homeScore) : null;
            const golesVisitante = match.awayScore !== null && match.awayScore !== undefined ? parseInt(match.awayScore) : null;
            
            let estado = 'PENDIENTE';
            if (golesLocal !== null && golesVisitante !== null) {
                estado = 'FINALIZADO';
            }

            // Upsert partido en PostgreSQL
            const partidoId = await new Promise((resolve, reject) => {
                // Verificar si existe
                conexion.query('SELECT id, estado, fecha_resultado FROM partido WHERE codigo_api = $1', [codigoApi], (err, selectRes) => {
                    if (err) return reject(err);

                    if (selectRes.rows.length > 0) {
                        const partidoExistente = selectRes.rows[0];
                        // Si ya estaba finalizado, mantener la fecha o asignarla si acaba de finalizar
                        let fechaResultado = partidoExistente.fecha_resultado;
                        if (estado === 'FINALIZADO' && !fechaResultado) {
                            fechaResultado = new Date();
                        }
                        
                        const sqlUpdate = `
                            UPDATE partido
                            SET equipo_local_id = $1, equipo_visitante_id = $2, fecha_partido = $3,
                                goles_local = $4, goles_visitante = $5, estado = $6,
                                fecha_resultado = $7
                            WHERE codigo_api = $8
                            RETURNING id
                        `;
                        conexion.query(
                            sqlUpdate,
                            [equipoLocalId, equipoVisitanteId, fechaPartido, golesLocal, golesVisitante, estado, fechaResultado, codigoApi],
                            (err2, updateRes) => {
                                if (err2) return reject(err2);
                                
                                // Si el estado cambió a FINALIZADO, registrar para cálculo de puntos
                                if (estado === 'FINALIZADO' && partidoExistente.estado !== 'FINALIZADO') {
                                    finalizadosParaProcesar.push(partidoExistente.id);
                                }
                                resolve(partidoExistente.id);
                            }
                        );
                    } else {
                        // Insertar partido nuevo
                        const fechaResultado = estado === 'FINALIZADO' ? new Date() : null;
                        const sqlInsert = `
                            INSERT INTO partido (codigo_api, equipo_local_id, equipo_visitante_id, fecha_partido, goles_local, goles_visitante, estado, fecha_resultado)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                            RETURNING id
                        `;
                        conexion.query(
                            sqlInsert,
                            [codigoApi, equipoLocalId, equipoVisitanteId, fechaPartido, golesLocal, golesVisitante, estado, fechaResultado],
                            (err2, insertRes) => {
                                if (err2) return reject(err2);
                                const newId = insertRes.rows[0].id;
                                if (estado === 'FINALIZADO') {
                                    finalizadosParaProcesar.push(newId);
                                }
                                resolve(newId);
                            }
                        );
                    }
                });
            });

            syncedCount++;
        }

        console.log(`Sincronización de partidos completada: ${syncedCount} procesados.`);
        
        // Si hay partidos que acaban de finalizar, recalcular predicciones y rankings
        if (finalizadosParaProcesar.length > 0) {
            console.log(`Ejecutando recálculo automático de predicciones para ${finalizadosParaProcesar.length} partidos...`);
            for (const pid of finalizadosParaProcesar) {
                await new Promise((resolve) => {
                    // Reutilizar lógica de partidos.controller para calcular puntajes
                    // y actualizar rachas / rankings
                    conexion.query(
                        `SELECT pr.*, pa.fecha_partido, pa.goles_local, pa.goles_visitante
                         FROM prediccion pr
                         INNER JOIN partido pa ON pr.partido_id = pa.id
                         WHERE pr.partido_id = $1`,
                        [pid],
                        (err, resPreds) => {
                            if (err || resPreds.rows.length === 0) return resolve();

                            const totalPreds = resPreds.rows.length;
                            let completados = 0;

                            resPreds.rows.forEach(pred => {
                                const puntosBase = calcularPuntos(
                                    pred.goles_local_pred, pred.goles_visitante_pred,
                                    pred.goles_local, pred.goles_visitante
                                );

                                const msDiferencia = new Date(pred.fecha_partido).getTime() - new Date(pred.fecha_prediccion).getTime();
                                const horasAnticipacion = msDiferencia / (1000 * 60 * 60);
                                const bonusAnticipacion = horasAnticipacion > 24 ? 1 : 0;

                                const acierto = (puntosBase >= 3) ? 1 : 0; // Ganador correcto es mínimo 3 puntos

                                conexion.query(
                                    `UPDATE prediccion
                                     SET puntos_base = $1, bonus_anticipacion = $2, acierto_ganador = $3,
                                         puntos_totales = $1 + $2 + bonus_racha
                                     WHERE id = $4`,
                                    [puntosBase, bonusAnticipacion, acierto, pred.id],
                                    () => {
                                        actualizarRachaYRanking(pred.usuario_id, pred.sala_id, () => {
                                            completados++;
                                            if (completados === totalPreds) {
                                                resolve();
                                            }
                                        });
                                    }
                                );
                            });
                        }
                    );
                });
            }
            console.log('Recálculo de predicciones completado.');
        }

        return syncedCount;
    } catch (err) {
        console.error('Error al sincronizar partidos:', err);
        throw err;
    }
}

module.exports = { syncTeams, syncMatches };
