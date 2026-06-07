-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Volcando estructura para tabla bd_mundial_predicciones.equipo
CREATE TABLE IF NOT EXISTS `equipo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo_fifa` varchar(10) DEFAULT NULL,
  `bandera_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.equipo: ~2 rows (aproximadamente)
INSERT INTO `equipo` (`id`, `nombre`, `codigo_fifa`, `bandera_url`) VALUES
	(1, 'Argentina', 'ARG', ''),
	(2, 'Brasil', 'BRA', ''),
	(3, 'España', 'ESP', '');

-- Volcando estructura para tabla bd_mundial_predicciones.historial_puntaje
CREATE TABLE IF NOT EXISTS `historial_puntaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `sala_id` int(11) NOT NULL,
  `partido_id` int(11) NOT NULL,
  `puntos_base` int(11) DEFAULT 0,
  `bonus_anticipacion` int(11) DEFAULT 0,
  `bonus_racha` int(11) DEFAULT 0,
  `total_otorgado` int(11) DEFAULT 0,
  `fecha_calculo` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_hp_usuario` (`usuario_id`),
  KEY `fk_hp_sala` (`sala_id`),
  KEY `fk_hp_partido` (`partido_id`),
  CONSTRAINT `fk_hp_partido` FOREIGN KEY (`partido_id`) REFERENCES `partido` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hp_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_hp_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.historial_puntaje: ~0 rows (aproximadamente)

-- Volcando estructura para tabla bd_mundial_predicciones.miembro_sala
CREATE TABLE IF NOT EXISTS `miembro_sala` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `sala_id` int(11) NOT NULL,
  `fecha_union` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`sala_id`),
  KEY `fk_ms_sala` (`sala_id`),
  CONSTRAINT `fk_ms_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ms_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.miembro_sala: ~1 rows (aproximadamente)
INSERT INTO `miembro_sala` (`id`, `usuario_id`, `sala_id`, `fecha_union`) VALUES
	(2, 3, 1, '2026-06-06 22:10:54');

-- Volcando estructura para tabla bd_mundial_predicciones.partido
CREATE TABLE IF NOT EXISTS `partido` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_local_id` int(11) NOT NULL,
  `equipo_visitante_id` int(11) NOT NULL,
  `fecha_partido` datetime NOT NULL,
  `estado` enum('PENDIENTE','EN_JUEGO','FINALIZADO','CANCELADO') DEFAULT 'PENDIENTE',
  `goles_local` int(11) DEFAULT NULL,
  `goles_visitante` int(11) DEFAULT NULL,
  `fecha_resultado` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_partido_local` (`equipo_local_id`),
  KEY `fk_partido_visitante` (`equipo_visitante_id`),
  CONSTRAINT `fk_partido_local` FOREIGN KEY (`equipo_local_id`) REFERENCES `equipo` (`id`),
  CONSTRAINT `fk_partido_visitante` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `equipo` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.partido: ~2 rows (aproximadamente)
INSERT INTO `partido` (`id`, `equipo_local_id`, `equipo_visitante_id`, `fecha_partido`, `estado`, `goles_local`, `goles_visitante`, `fecha_resultado`) VALUES
	(1, 1, 2, '2026-07-10 20:00:00', 'FINALIZADO', 2, 1, '2026-06-06 18:02:24'),
	(2, 2, 3, '2026-07-15 20:00:00', 'PENDIENTE', NULL, NULL, NULL),
	(3, 1, 3, '2026-07-20 20:00:00', 'FINALIZADO', 2, 0, '2026-06-06 18:58:17');

-- Volcando estructura para tabla bd_mundial_predicciones.prediccion
CREATE TABLE IF NOT EXISTS `prediccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `sala_id` int(11) NOT NULL,
  `partido_id` int(11) NOT NULL,
  `goles_local_pred` int(11) NOT NULL,
  `goles_visitante_pred` int(11) NOT NULL,
  `fecha_prediccion` datetime DEFAULT current_timestamp(),
  `puntos_base` int(11) DEFAULT 0,
  `bonus_anticipacion` int(11) DEFAULT 0,
  `bonus_racha` int(11) DEFAULT 0,
  `puntos_totales` int(11) DEFAULT 0,
  `acierto_ganador` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id` (`usuario_id`,`sala_id`,`partido_id`),
  KEY `fk_pred_sala` (`sala_id`),
  KEY `fk_pred_partido` (`partido_id`),
  CONSTRAINT `fk_pred_partido` FOREIGN KEY (`partido_id`) REFERENCES `partido` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pred_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pred_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.prediccion: ~2 rows (aproximadamente)
INSERT INTO `prediccion` (`id`, `usuario_id`, `sala_id`, `partido_id`, `goles_local_pred`, `goles_visitante_pred`, `fecha_prediccion`, `puntos_base`, `bonus_anticipacion`, `bonus_racha`, `puntos_totales`, `acierto_ganador`) VALUES
	(1, 1, 1, 1, 2, 1, '2026-06-06 17:57:11', 0, 1, 0, 6, 1),
	(2, 1, 1, 2, 2, 0, '2026-06-06 18:55:49', 0, 1, 0, 1, 1),
	(3, 1, 1, 3, 3, 1, '2026-06-06 18:55:57', 0, 1, 2, 6, 1);

-- Volcando estructura para tabla bd_mundial_predicciones.ranking
CREATE TABLE IF NOT EXISTS `ranking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sala_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `puntos_acumulados` int(11) DEFAULT 0,
  `aciertos_exactos` int(11) DEFAULT 0,
  `aciertos_ganador` int(11) DEFAULT 0,
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sala_id` (`sala_id`,`usuario_id`),
  KEY `fk_rank_usuario` (`usuario_id`),
  CONSTRAINT `fk_rank_sala` FOREIGN KEY (`sala_id`) REFERENCES `sala` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rank_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.ranking: ~0 rows (aproximadamente)

-- Volcando estructura para tabla bd_mundial_predicciones.sala
CREATE TABLE IF NOT EXISTS `sala` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo_invitacion` varchar(20) NOT NULL,
  `creador_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_invitacion` (`codigo_invitacion`),
  KEY `fk_sala_creador` (`creador_id`),
  CONSTRAINT `fk_sala_creador` FOREIGN KEY (`creador_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.sala: ~0 rows (aproximadamente)
INSERT INTO `sala` (`id`, `nombre`, `codigo_invitacion`, `creador_id`, `fecha_creacion`) VALUES
	(1, 'Mundial Tecsup', 'TEC2026', 1, '2026-06-06 22:09:10');

-- Volcando estructura para tabla bd_mundial_predicciones.usuario
CREATE TABLE IF NOT EXISTS `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('ADMIN','USUARIO') DEFAULT 'USUARIO',
  `activo` tinyint(1) DEFAULT 1,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla bd_mundial_predicciones.usuario: ~2 rows (aproximadamente)
INSERT INTO `usuario` (`id`, `nombre`, `correo`, `password`, `rol`, `activo`, `fecha_registro`) VALUES
	(1, 'Carlos', 'carlos@gmail.com', '123456', 'USUARIO', 1, '2026-06-06 21:56:52'),
	(3, 'Luis', 'luis@gmail.com', '123456', 'USUARIO', 1, '2026-06-06 22:10:29');

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
