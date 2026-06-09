-- --------------------------------------------------------
-- Esquema de Base de Datos para PostgreSQL (Producción Limpio)
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

-- Insertar únicamente el usuario Administrador (password: 123456)
INSERT INTO usuario (id, nombre, correo, password, rol, activo) VALUES
	(1, 'Carlos', 'carlos@gmail.com', '$2b$10$FevCoUdpKA8bfd8ZYM5hZuyMTbE3mMos4h3RXyQrzJAeu/fR1YYhm', 'ADMIN', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Tabla de Equipos
CREATE TABLE IF NOT EXISTS equipo (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo_fifa VARCHAR(10) NOT NULL UNIQUE,
  bandera_url VARCHAR(255) DEFAULT NULL
);

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

-- Reiniciar la secuencia de seriales
SELECT setval(pg_get_serial_sequence('usuario', 'id'), COALESCE(MAX(id), 1)) FROM usuario;
