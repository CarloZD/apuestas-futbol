/**
 * Script de Pruebas de Estrés y Carga para ApuestApp
 * Simula múltiples usuarios concurrentes realizando peticiones al servidor.
 * 
 * Uso: node stress_test.js [BASE_URL] [NUM_USERS] [CONCURRENCY]
 * Ejemplo: node stress_test.js http://localhost:3000 50 10
 */

const http = require('http');
const url = require('url');

const args = process.argv.slice(2);
const BASE_URL = args[0] || 'http://localhost:3000';
const NUM_USERS = parseInt(args[1] || '30');
const CONCURRENCY = parseInt(args[2] || '5');

console.log(`========================================================`);
console.log(`INICIANDO PRUEBA DE ESTRÉS - APUESTAPP`);
console.log(`URL Base: ${BASE_URL}`);
console.log(`Usuarios a simular: ${NUM_USERS}`);
console.log(`Nivel de Concurrencia: ${CONCURRENCY}`);
console.log(`========================================================\n`);

function makeRequest(method, path, body = null, token = null) {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(BASE_URL + path);
        const postData = body ? JSON.stringify(body) : '';

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const start = Date.now();
        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', chunk => responseBody += chunk);
            res.on('end', () => {
                const duration = Date.now() - start;
                let parsed = null;
                try {
                    parsed = JSON.parse(responseBody);
                } catch (e) {
                    parsed = responseBody;
                }
                resolve({
                    status: res.statusCode,
                    data: parsed,
                    duration: duration
                });
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (body) {
            req.write(postData);
        }
        req.end();
    });
}

async function run() {
    let successCount = 0;
    let failCount = 0;
    let totalDuration = 0;
    let latencies = [];

    const startTest = Date.now();

    // 1. Crear sala de pruebas con admin
    console.log('[Setup] Creando sala y partidos de prueba con cuenta de administrador...');
    let adminToken = '';
    try {
        const loginRes = await makeRequest('POST', '/auth/login', {
            correo: 'carlos@gmail.com',
            password: '123456' // contrasena por defecto
        });
        if (loginRes.status === 200) {
            adminToken = loginRes.data.token;
            console.log('[Setup] Administrador logueado con éxito.');
        } else {
            console.log('[Setup] Falló login de admin. Asegúrate de correr el script SQL.');
        }
    } catch (e) {
        console.log('[Setup] Error al conectar al backend:', e.message);
        return;
    }

    let codigoInvitacion = 'STRESS' + Math.floor(Math.random() * 10000);
    let salaId = null;

    if (adminToken) {
        try {
            // Sincronizar Zafronix si es necesario
            console.log('[Setup] Sincronizando partidos de la API...');
            await makeRequest('POST', '/partidos/sync', {}, adminToken);

            // Obtener primer partido de la DB
            const partidosRes = await makeRequest('GET', '/partidos', null, adminToken);
            const partidoId = partidosRes.data[0]?.id;

            if (partidoId) {
                const salaRes = await makeRequest('POST', '/salas', {
                    nombre: 'Sala Stress Test',
                    codigo_invitacion: codigoInvitacion,
                    partidos: [partidoId]
                }, adminToken);
                salaId = salaRes.data.id;
                console.log(`[Setup] Sala de estrés creada. ID: ${salaId}, Código: ${codigoInvitacion}`);
            }
        } catch (e) {
            console.log('[Setup] No se pudo crear sala de prueba:', e.message);
        }
    }

    if (!salaId) {
        console.log('[Advertencia] No se pudo preparar la sala de prueba. Usando sala por defecto ID: 1');
        salaId = 1;
        codigoInvitacion = 'TEC2026';
    }

    console.log(`\n[Test] Iniciando carga de ${NUM_USERS} usuarios concurrentes...`);

    // Array de usuarios a procesar
    const userIndices = Array.from({ length: NUM_USERS }, (_, i) => i + 1);
    
    // Función para procesar un lote concurrente
    const processBatch = async (batch) => {
        const promises = batch.map(async (idx) => {
            const email = `stress_user_${idx}_${Math.floor(Math.random() * 10000)}@gmail.com`;
            const name = `Stress User ${idx}`;
            const password = 'password123';

            try {
                // 1. Registro
                let start = Date.now();
                const regRes = await makeRequest('POST', '/auth/register', {
                    nombre: name,
                    correo: email,
                    password: password
                });
                latencies.push(Date.now() - start);

                if (regRes.status === 201) {
                    successCount++;
                } else {
                    failCount++;
                    return;
                }

                // 2. Login
                start = Date.now();
                const logRes = await makeRequest('POST', '/auth/login', {
                    correo: email,
                    password: password
                });
                latencies.push(Date.now() - start);

                if (logRes.status === 200) {
                    successCount++;
                } else {
                    failCount++;
                    return;
                }

                const userToken = logRes.data.token;

                // 3. Unirse a sala
                start = Date.now();
                const joinRes = await makeRequest('POST', '/salas/unirse', {
                    codigo_invitacion: codigoInvitacion
                }, userToken);
                latencies.push(Date.now() - start);

                if (joinRes.status === 200 || joinRes.status === 409) {
                    successCount++;
                } else {
                    failCount++;
                    return;
                }

                // 4. Obtener ranking
                start = Date.now();
                const rankRes = await makeRequest('GET', `/ranking/${salaId}`, null, userToken);
                latencies.push(Date.now() - start);

                if (rankRes.status === 200) {
                    successCount++;
                } else {
                    failCount++;
                }

            } catch (err) {
                failCount++;
                console.error(`Error en usuario ${idx}:`, err.message);
            }
        });

        await Promise.all(promises);
    };

    // Particionar usuarios en lotes de tamaño CONCURRENCY
    for (let i = 0; i < userIndices.length; i += CONCURRENCY) {
        const batch = userIndices.slice(i, i + CONCURRENCY);
        await processBatch(batch);
        console.log(`Procesado lote: ${i + batch.length}/${NUM_USERS} usuarios...`);
    }

    const testDuration = (Date.now() - startTest) / 1000;
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    console.log(`\n========================================================`);
    console.log(`RESULTADOS DE LA PRUEBA DE ESTRÉS`);
    console.log(`========================================================`);
    console.log(`Duración total de prueba: ${testDuration.toFixed(2)} segundos`);
    console.log(`Peticiones Exitosas: ${successCount}`);
    console.log(`Peticiones Fallidas: ${failCount}`);
    console.log(`Tasa de Éxito: ${((successCount / (successCount + failCount)) * 100).toFixed(2)}%`);
    console.log(`Latencia Promedio: ${avgLatency.toFixed(2)} ms`);
    console.log(`Throughput Estimado: ${(successCount / testDuration).toFixed(2)} req/sec`);
    console.log(`========================================================`);
}

run();
