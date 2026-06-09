-- --------------------------------------------------------
-- Esquema de Base de Datos para PostgreSQL (Actualizado)
-- --------------------------------------------------------

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuario (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) DEFAULT 'USUARIO' CHECK (rol IN ('ADMIN', 'USUARIO')),
  activo BOOLEAN DEFAULT TRUE,
  fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales para usuarios (password: 123456)
INSERT INTO usuario (id, nombre, correo, password, rol, activo) VALUES
	(1, 'Carlos', 'carlos@gmail.com', '$2b$10$FevCoUdpKA8bfd8ZYM5hZuyMTbE3mMos4h3RXyQrzJAeu/fR1YYhm', 'ADMIN', TRUE),
	(3, 'Luis', 'luis@gmail.com', '$2b$10$FevCoUdpKA8bfd8ZYM5hZuyMTbE3mMos4h3RXyQrzJAeu/fR1YYhm', 'USUARIO', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Tabla de Equipos
CREATE TABLE IF NOT EXISTS equipo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_fifa VARCHAR(10) NOT NULL UNIQUE,
  bandera_url VARCHAR(255) DEFAULT NULL
);

-- Insertar datos iniciales para equipos
INSERT INTO equipo (id, nombre, codigo_fifa, bandera_url) VALUES
	(1, 'Argentina', 'ARG', 'https://flagcdn.com/w320/ar.png'),
	(2, 'Brasil', 'BRA', 'https://flagcdn.com/w320/br.png'),
	(3, 'España', 'ESP', 'https://flagcdn.com/w320/es.png')
ON CONFLICT (id) DO NOTHING;

-- Tabla de Partidos
CREATE TABLE IF NOT EXISTS partido (
  id SERIAL PRIMARY KEY,
  codigo_api VARCHAR(50) UNIQUE DEFAULT NULL,
  equipo_local_id INT NOT NULL,
  equipo_visitante_id INT NOT NULL,
  fecha_partido TIMESTAMP NOT NULL,
  estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'EN_JUEGO', 'FINALIZADO', 'CANCELADO')),
  goles_local INT DEFAULT NULL,
  goles_visitante INT DEFAULT NULL,
  fecha_resultado TIMESTAMP DEFAULT NULL,
  CONSTRAINT fk_partido_local FOREIGN KEY (equipo_local_id) REFERENCES equipo (id) ON DELETE RESTRICT,
  CONSTRAINT fk_partido_visitante FOREIGN KEY (equipo_visitante_id) REFERENCES equipo (id) ON DELETE RESTRICT
);

-- Insertar datos iniciales para partidos
INSERT INTO partido (id, codigo_api, equipo_local_id, equipo_visitante_id, fecha_partido, estado, goles_local, goles_visitante, fecha_resultado) VALUES
	(1, '2026-manual-01', 1, 2, '2026-07-10 20:00:00', 'FINALIZADO', 2, 1, '2026-06-06 18:02:24'),
	(2, '2026-manual-02', 2, 3, '2026-07-15 20:00:00', 'PENDIENTE', NULL, NULL, NULL),
	(3, '2026-manual-03', 1, 3, '2026-07-20 20:00:00', 'FINALIZADO', 2, 0, '2026-06-06 18:58:17')
ON CONFLICT (id) DO NOTHING;

-- Tabla de Salas (Grupos) - Cada sala corresponde a un único partido
CREATE TABLE IF NOT EXISTS sala (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_invitacion VARCHAR(20) NOT NULL UNIQUE,
  creador_id INT NOT NULL,
  partido_id INT NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sala_creador FOREIGN KEY (creador_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_sala_partido FOREIGN KEY (partido_id) REFERENCES partido (id) ON DELETE CASCADE
);

-- Insertar datos iniciales para salas (asociada al partido 1)
INSERT INTO sala (id, nombre, codigo_invitacion, creador_id, partido_id) VALUES
	(1, 'Mundial Tecsup', 'TEC2026', 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Tabla Relacional de Miembros de Sala
CREATE TABLE IF NOT EXISTS miembro_sala (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  sala_id INT NOT NULL,
  fecha_union TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ms_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_ms_sala FOREIGN KEY (sala_id) REFERENCES sala (id) ON DELETE CASCADE,
  CONSTRAINT ms_usuario_sala_unique UNIQUE (usuario_id, sala_id)
);

-- Insertar datos iniciales para miembros de sala (Carlos y Luis)
INSERT INTO miembro_sala (id, usuario_id, sala_id, fecha_union) VALUES
	(1, 1, 1, '2026-06-06 22:10:54'),
	(2, 3, 1, '2026-06-06 22:10:54')
ON CONFLICT (id) DO NOTHING;

-- Tabla de Predicciones
CREATE TABLE IF NOT EXISTS prediccion (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  sala_id INT NOT NULL,
  partido_id INT NOT NULL,
  goles_local_pred INT NOT NULL,
  goles_visitante_pred INT NOT NULL,
  fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  puntos_base INT DEFAULT 0,
  bonus_anticipacion INT DEFAULT 0,
  bonus_racha INT DEFAULT 0,
  puntos_totales INT DEFAULT 0,
  acierto_ganador INT DEFAULT 0, -- 0 o 1
  CONSTRAINT fk_pred_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_pred_sala FOREIGN KEY (sala_id) REFERENCES sala (id) ON DELETE CASCADE,
  CONSTRAINT fk_pred_partido FOREIGN KEY (partido_id) REFERENCES partido (id) ON DELETE CASCADE,
  CONSTRAINT pred_usuario_sala_partido_unique UNIQUE (usuario_id, sala_id, partido_id)
);

-- Insertar predicciones iniciales
INSERT INTO prediccion (id, usuario_id, sala_id, partido_id, goles_local_pred, goles_visitante_pred, fecha_prediccion, puntos_base, bonus_anticipacion, bonus_racha, puntos_totales, acierto_ganador) VALUES
	(1, 1, 1, 1, 2, 1, '2026-06-06 17:57:11', 5, 1, 0, 6, 1),
	(2, 1, 1, 2, 2, 0, '2026-06-06 18:55:49', 0, 1, 0, 1, 0),
	(3, 1, 1, 3, 3, 1, '2026-06-06 18:55:57', 3, 1, 2, 6, 1)
ON CONFLICT (id) DO NOTHING;

-- Tabla de Ranking / Tabla de Posiciones
CREATE TABLE IF NOT EXISTS ranking (
  id SERIAL PRIMARY KEY,
  sala_id INT NOT NULL,
  usuario_id INT NOT NULL,
  puntos_acumulados INT DEFAULT 0,
  aciertos_exactos INT DEFAULT 0,
  aciertos_ganador INT DEFAULT 0,
  ultima_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rank_sala FOREIGN KEY (sala_id) REFERENCES sala (id) ON DELETE CASCADE,
  CONSTRAINT fk_rank_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT rank_sala_usuario_unique UNIQUE (sala_id, usuario_id)
);

-- Tabla de Historial de Puntaje
CREATE TABLE IF NOT EXISTS historial_puntaje (
  id SERIAL PRIMARY KEY,
  usuario_id INT NOT NULL,
  sala_id INT NOT NULL,
  partido_id INT NOT NULL,
  puntos_base INT DEFAULT 0,
  bonus_anticipacion INT DEFAULT 0,
  bonus_racha INT DEFAULT 0,
  total_otorgado INT DEFAULT 0,
  fecha_calculo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hp_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
  CONSTRAINT fk_hp_sala FOREIGN KEY (sala_id) REFERENCES sala (id) ON DELETE CASCADE,
  CONSTRAINT fk_hp_partido FOREIGN KEY (partido_id) REFERENCES partido (id) ON DELETE CASCADE
);

-- Reiniciar la secuencia de seriales para evitar problemas con inserciones con ID explícito
SELECT setval(pg_get_serial_sequence('usuario', 'id'), COALESCE(MAX(id), 1)) FROM usuario;
SELECT setval(pg_get_serial_sequence('equipo', 'id'), COALESCE(MAX(id), 1)) FROM equipo;
SELECT setval(pg_get_serial_sequence('partido', 'id'), COALESCE(MAX(id), 1)) FROM partido;
SELECT setval(pg_get_serial_sequence('sala', 'id'), COALESCE(MAX(id), 1)) FROM sala;
SELECT setval(pg_get_serial_sequence('miembro_sala', 'id'), COALESCE(MAX(id), 1)) FROM miembro_sala;
SELECT setval(pg_get_serial_sequence('prediccion', 'id'), COALESCE(MAX(id), 1)) FROM prediccion;
SELECT setval(pg_get_serial_sequence('ranking', 'id'), COALESCE(MAX(id), 1)) FROM ranking;
