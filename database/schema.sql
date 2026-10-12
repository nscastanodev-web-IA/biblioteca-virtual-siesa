-- =====================================================================
-- Biblioteca Virtual Siesa — Esquema MariaDB
-- =====================================================================
-- Ejecutar con:  mariadb -u root -p < database/schema.sql
-- El backend usa PDO con consultas preparadas; nunca concatena SQL.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS biblioteca_siesa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE biblioteca_siesa;

-- Orden de borrado por dependencias (para reiniciar el entorno en desarrollo).
DROP TABLE IF EXISTS document_downloads;
DROP TABLE IF EXISTS document_feedback;
DROP TABLE IF EXISTS document_related;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS request_attachments;
DROP TABLE IF EXISTS request_history;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS login_attempts;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email                VARCHAR(190) NOT NULL UNIQUE,
  phone                VARCHAR(30)  NOT NULL DEFAULT '',
  nit                  VARCHAR(30)  NOT NULL DEFAULT '',
  company              VARCHAR(190) NOT NULL DEFAULT '',
  first_name           VARCHAR(100) NOT NULL,
  last_name            VARCHAR(100) NOT NULL,
  job_title            VARCHAR(120) NOT NULL DEFAULT '',
  system_name          VARCHAR(120) NOT NULL DEFAULT 'Por configurar',
  password_hash        VARCHAR(255) NOT NULL,
  role                 ENUM('cliente','agente') NOT NULL DEFAULT 'cliente',
  status               ENUM('pendiente','activo','inactivo') NOT NULL DEFAULT 'pendiente',
  theme_preference     ENUM('light','dark','system') NOT NULL DEFAULT 'system',
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified_at    DATETIME NULL,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at        DATETIME NULL,
  INDEX idx_users_nit (nit),
  INDEX idx_users_role_status (role, status)
);

-- ---------------------------------------------------------------------
-- Tokens de un solo uso (verificación de correo / recuperación)
-- ---------------------------------------------------------------------
CREATE TABLE auth_tokens (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  purpose     ENUM('verify_email','reset_password') NOT NULL,
  token_hash  CHAR(64) NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  INDEX idx_auth_tokens_user (user_id, purpose)
);

-- ---------------------------------------------------------------------
-- Límite de intentos de inicio de sesión
-- ---------------------------------------------------------------------
CREATE TABLE login_attempts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(190) NOT NULL,
  ip_address   VARCHAR(45)  NOT NULL,
  successful   BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_attempts (email, attempted_at)
);

-- ---------------------------------------------------------------------
-- Documentos
-- ---------------------------------------------------------------------
CREATE TABLE documents (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  description       TEXT NOT NULL,
  type              ENUM('Manual','Comunicado') NOT NULL,
  system_name       VARCHAR(120) NOT NULL,
  application_name  VARCHAR(120) NOT NULL,
  version_label     VARCHAR(50)  NULL,
  publication_year  SMALLINT UNSIGNED NOT NULL,
  keywords          JSON NOT NULL,
  -- Nombre interno aleatorio; el directorio queda fuera de la raíz pública.
  pdf_path          VARCHAR(500) NOT NULL,
  original_name     VARCHAR(255) NOT NULL DEFAULT '',
  detected_mime     VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  detected_size     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  current_version   INT UNSIGNED NOT NULL DEFAULT 1,
  views_count       INT UNSIGNED NOT NULL DEFAULT 0,
  downloads_count   INT UNSIGNED NOT NULL DEFAULT 0,
  status            ENUM('borrador','publicado','inactivo') NOT NULL DEFAULT 'borrador',
  published_at      DATETIME NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by        BIGINT UNSIGNED NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_documents_filters (status, type, system_name, publication_year),
  FULLTEXT INDEX ft_documents (title, description)
);

-- Documentos relacionados (relación N:M simétrica)
CREATE TABLE document_related (
  document_id BIGINT UNSIGNED NOT NULL,
  related_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (document_id, related_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (related_id)  REFERENCES documents(id) ON DELETE CASCADE
);

-- Historial de versiones del PDF
CREATE TABLE document_versions (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id         BIGINT UNSIGNED NOT NULL,
  version_number      INT UNSIGNED NOT NULL,
  pdf_path            VARCHAR(500) NOT NULL,
  original_name       VARCHAR(255) NOT NULL,
  detected_size       BIGINT UNSIGNED NOT NULL,
  responsible_user_id BIGINT UNSIGNED NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  UNIQUE KEY uq_document_version (document_id, version_number)
);

-- Métrica de cada descarga (trazabilidad, no solo un contador)
CREATE TABLE document_downloads (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  ip_address  VARCHAR(45) NOT NULL DEFAULT '',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_downloads_document (document_id, created_at)
);

-- ¿El documento fue útil? (Sí / No)
CREATE TABLE document_feedback (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  helpful     BOOLEAN NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY uq_feedback_user_document (document_id, user_id)
);

-- ---------------------------------------------------------------------
-- Solicitudes
-- ---------------------------------------------------------------------
CREATE TABLE requests (
  id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consecutive             VARCHAR(30) NOT NULL UNIQUE,
  client_id               BIGINT UNSIGNED NOT NULL,
  document_type           ENUM('Manual','Comunicado') NOT NULL,
  request_type            ENUM('Documento nuevo','Actualización','Corrección') NOT NULL,
  system_name             VARCHAR(120) NOT NULL,
  application_name        VARCHAR(120) NOT NULL,
  version_label           VARCHAR(50) NULL,
  publication_year        SMALLINT UNSIGNED NOT NULL,
  title                   VARCHAR(255) NOT NULL,
  description             TEXT NOT NULL,
  reason                  TEXT NOT NULL,
  priority                ENUM('Baja','Media','Alta') NOT NULL,
  notification_channel    ENUM('aplicación','correo','ambos') NOT NULL DEFAULT 'ambos',
  status                  ENUM('Recibida','En validación','Información adicional requerida','Aprobada','En producción','Documento disponible','Rechazada','Cerrada') NOT NULL DEFAULT 'Recibida',
  assigned_to             BIGINT UNSIGNED NULL,
  estimated_at            DATETIME NULL,
  related_document_id     BIGINT UNSIGNED NULL,
  production_instructions TEXT NULL,
  created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (related_document_id) REFERENCES documents(id),
  INDEX idx_requests_client_status (client_id, status),
  INDEX idx_requests_status_priority (status, priority)
);

-- Historial completo: estado anterior, nuevo estado, quién, cuándo y comentario.
CREATE TABLE request_history (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id          BIGINT UNSIGNED NOT NULL,
  previous_status     VARCHAR(60) NULL,
  new_status          VARCHAR(60) NOT NULL,
  action_name         VARCHAR(120) NOT NULL,
  comment_text        TEXT NULL,
  -- 'interno' nunca se serializa hacia el cliente.
  visibility          ENUM('cliente','interno') NOT NULL DEFAULT 'cliente',
  responsible_user_id BIGINT UNSIGNED NOT NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  INDEX idx_history_request (request_id, created_at)
);

CREATE TABLE request_attachments (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  request_id    BIGINT UNSIGNED NOT NULL,
  history_id    BIGINT UNSIGNED NULL,
  uploaded_by   BIGINT UNSIGNED NOT NULL,
  stored_path   VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  detected_mime VARCHAR(100) NOT NULL,
  detected_size BIGINT UNSIGNED NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
  FOREIGN KEY (history_id) REFERENCES request_history(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- ---------------------------------------------------------------------
-- Notificaciones
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  title      VARCHAR(190) NOT NULL,
  message    TEXT NOT NULL,
  link_path  VARCHAR(500) NULL,
  read_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_read (user_id, read_at)
);
