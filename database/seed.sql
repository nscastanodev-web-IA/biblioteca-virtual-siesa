-- =====================================================================
-- Biblioteca Virtual Siesa — Datos de demostración
-- =====================================================================
-- Requiere haber ejecutado database/schema.sql.
-- Todas las cuentas de demo usan la contraseña: demo1234
--   Cliente : cliente@siesa.com
--   Agente  : agente@siesa.com
-- Ejecutar: mariadb -u root -p < database/seed.sql
--
-- Las fechas se anclan a mediados de 2026 para que el prototipo muestre
-- etiquetas "Nuevo" (publicado hace menos de 30 días) y "Actualizado".
-- =====================================================================

USE biblioteca_siesa;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE document_downloads;
TRUNCATE TABLE document_feedback;
TRUNCATE TABLE document_related;
TRUNCATE TABLE document_versions;
TRUNCATE TABLE notifications;
TRUNCATE TABLE request_attachments;
TRUNCATE TABLE request_history;
TRUNCATE TABLE requests;
TRUNCATE TABLE documents;
TRUNCATE TABLE auth_tokens;
TRUNCATE TABLE login_attempts;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Usuarios (hash bcrypt de 'demo1234')
-- ---------------------------------------------------------------------
INSERT INTO users
  (id, email, phone, nit, company, first_name, last_name, job_title, system_name, password_hash, role, status, theme_preference, onboarding_completed, email_verified_at, created_at)
VALUES
  (1, 'cliente@siesa.com', '3001234567', '900123456', 'Comercializadora Andina S.A.S.', 'Alejandro', 'Torres', 'Contador General', 'SIESA Contabilidad',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'cliente', 'activo', 'system', TRUE, '2025-03-16 09:00:00', '2025-03-15 08:30:00'),
  (2, 'mflopez@textilescol.com', '3109876543', '800456789', 'Textiles Colombia Ltda.', 'María Fernanda', 'López', 'Gerente Financiera', 'SIESA Enterprise',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'cliente', 'activo', 'light', TRUE, '2024-11-21 10:15:00', '2024-11-20 14:05:00'),
  (3, 'cmendoza@grupoalfa.co', '3155678901', '830987654', 'Grupo Alfa Holding', 'Carlos', 'Mendoza', 'Director de TI', 'SIESA Cloud',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'cliente', 'activo', 'dark', TRUE, '2025-01-09 11:40:00', '2025-01-08 16:20:00'),
  (4, 'sruiz@distribuidoramax.com', '3187654321', '860234567', 'Distribuidora Max S.A.', 'Sandra', 'Ruiz', 'Jefa de Recursos Humanos', 'SIESA Nómina',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'cliente', 'activo', 'system', TRUE, '2024-09-04 08:00:00', '2024-09-03 12:45:00'),
  (5, 'jgomez@eltornillo.com', '3223344556', '901234567', 'Ferretería El Tornillo S.A.S.', 'Julián', 'Gómez', 'Analista Contable', 'SIESA Facturación',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'cliente', 'activo', 'system', FALSE, NULL, '2026-02-11 09:25:00'),
  (6, 'agente@siesa.com', '3009998877', '', 'Siesa', 'Laura', 'Restrepo', 'Analista de Mesa de Servicio', 'Mesa de Servicio',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'agente', 'activo', 'system', TRUE, '2024-01-05 08:00:00', '2024-01-05 08:00:00'),
  (7, 'dcastro@siesa.com', '3015554433', '', 'Siesa', 'Diego', 'Castro', 'Líder de Documentación', 'Documentación',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'agente', 'activo', 'light', TRUE, '2024-01-08 08:00:00', '2024-01-08 08:00:00'),
  (8, 'pvega@siesa.com', '3047776655', '', 'Siesa', 'Paula', 'Vega', 'Especialista Funcional de Nómina', 'Producción',
   '$2y$10$Wyk4V68HEBm.cqPpRPhCLu7csJZvsLNFr7kB4r5/wfCDB8fzVAe3e', 'agente', 'activo', 'system', TRUE, '2024-02-14 08:00:00', '2024-02-14 08:00:00');

-- ---------------------------------------------------------------------
-- Documentos
-- ---------------------------------------------------------------------
INSERT INTO documents
  (id, title, description, type, system_name, application_name, version_label, publication_year, keywords,
   pdf_path, original_name, detected_mime, detected_size, current_version, views_count, downloads_count,
   status, published_at, created_at, updated_at, created_by)
VALUES
  (1, 'Manual de configuración de nómina',
   'Paso a paso para configurar parámetros de nómina, conceptos, centros de costo y calendario de liquidación en SIESA Nómina.',
   'Manual', 'SIESA Nómina', 'Liquidación', '3.2', 2026,
   '["nomina","configuracion","liquidacion","parametros"]',
   'documents/a1f9c2e40b.pdf', 'manual-configuracion-nomina-v3.2.pdf', 'application/pdf', 2418432, 2, 1482, 396,
   'publicado', '2026-09-15 09:00:00', '2026-09-15 09:00:00', '2026-09-15 09:00:00', 7),

  (2, 'Manual de facturación electrónica',
   'Configuración de resoluciones DIAN, rangos de numeración, notas crédito y envío de documentos electrónicos.',
   'Manual', 'SIESA Facturación', 'Facturación Electrónica', '2.5', 2026,
   '["facturacion","electronica","dian","resoluciones"]',
   'documents/b7d3aa518c.pdf', 'manual-facturacion-electronica-v2.5.pdf', 'application/pdf', 3187200, 1, 2106, 731,
   'publicado', '2026-07-10 08:30:00', '2026-07-10 08:30:00', '2026-08-12 15:20:00', 6),

  (3, 'Manual de cierre contable',
   'Secuencia de cierre mensual y anual: depreciaciones, ajustes, conciliaciones y bloqueo de periodos.',
   'Manual', 'SIESA Contabilidad', 'Cierre Contable', '2.1', 2026,
   '["cierre","contable","periodos","conciliacion"]',
   'documents/c2e88f90d4.pdf', 'manual-cierre-contable-v2.1.pdf', 'application/pdf', 1876543, 1, 1739, 512,
   'publicado', '2026-06-22 10:00:00', '2026-06-22 10:00:00', '2026-06-22 10:00:00', 7),

  (4, 'Comunicado de actualización tributaria 2026',
   'Cambios normativos vigentes para el año gravable 2026 y su impacto en los módulos financieros.',
   'Comunicado', 'SIESA Enterprise', 'Módulo Financiero', '1.0', 2026,
   '["tributaria","impuestos","normatividad","2026"]',
   'documents/d4b1c7736e.pdf', 'comunicado-actualizacion-tributaria-2026.pdf', 'application/pdf', 684320, 1, 3218, 1204,
   'publicado', '2026-03-15 07:00:00', '2026-03-15 07:00:00', '2026-03-15 07:00:00', 7),

  (5, 'Comunicado de mantenimiento programado',
   'Ventana de mantenimiento del servicio en la nube, alcance e impactos esperados por módulo.',
   'Comunicado', 'SIESA Cloud', 'Portal Web', '1.0', 2026,
   '["mantenimiento","ventana","cloud","disponibilidad"]',
   'documents/e9f0ab4417.pdf', 'comunicado-mantenimiento-programado.pdf', 'application/pdf', 412880, 1, 1894, 302,
   'publicado', '2026-09-29 06:00:00', '2026-09-29 06:00:00', '2026-09-29 06:00:00', 6),

  (6, 'Guía de configuración de usuarios y permisos',
   'Creación de usuarios, roles, perfiles de seguridad y auditoría de accesos.',
   'Manual', 'SIESA Enterprise', 'Módulo de Reportes', '1.8', 2025,
   '["usuarios","permisos","roles","seguridad"]',
   'documents/f1a2b3c4d5.pdf', 'guia-configuracion-usuarios-v1.8.pdf', 'application/pdf', 1120984, 1, 1265, 418,
   'publicado', '2025-10-14 09:45:00', '2025-10-14 09:45:00', '2026-05-18 11:05:00', 7),

  (7, 'Manual de prestaciones sociales',
   'Cálculo y liquidación de cesantías, intereses, prima y vacaciones con validaciones del sistema.',
   'Manual', 'SIESA Nómina', 'Prestaciones Sociales', '2.0', 2026,
   '["prestaciones","cesantias","prima","vacaciones"]',
   'documents/a7f6e5d4c3.pdf', 'manual-prestaciones-sociales-v2.0.pdf', 'application/pdf', 2087654, 1, 942, 287,
   'publicado', '2026-05-30 11:20:00', '2026-05-30 11:20:00', '2026-05-30 11:20:00', 8),

  (8, 'Manual de cuentas por pagar',
   'Registro de facturas de proveedor, programación de pagos, retenciones y conciliación de saldos.',
   'Manual', 'SIESA Contabilidad', 'Cuentas por Pagar', '1.5', 2026,
   '["cuentas por pagar","proveedores","pagos","retenciones"]',
   'documents/b8e7d6c5b4.pdf', 'manual-cuentas-por-pagar-v1.5.pdf', 'application/pdf', 1654321, 1, 811, 240,
   'publicado', '2026-04-11 13:10:00', '2026-04-11 13:10:00', '2026-04-11 13:10:00', 6),

  (9, 'Comunicado de nuevas funcionalidades de la API',
   'Nuevos endpoints, versionado y política de compatibilidad para integraciones.',
   'Comunicado', 'SIESA Cloud', 'API Gateway', '1.0', 2026,
   '["api","integraciones","versionado","endpoints"]',
   'documents/c9d8e7f6a5.pdf', 'comunicado-api-gateway-2026.pdf', 'application/pdf', 528910, 1, 1543, 366,
   'publicado', '2026-10-07 08:00:00', '2026-10-07 08:00:00', '2026-10-07 08:00:00', 6),

  (10, 'Manual de presupuestos',
   'Definición, ejecución y seguimiento presupuestal por centro de costo y periodo.',
   'Manual', 'SIESA Contabilidad', 'Presupuestos', '1.0', 2026,
   '["presupuesto","centro de costo","ejecucion"]',
   'documents/d0c9b8a7f6.pdf', 'manual-presupuestos-v1.0.pdf', 'application/pdf', 1443287, 1, 604, 158,
   'publicado', '2026-02-02 15:30:00', '2026-02-02 15:30:00', '2026-02-02 15:30:00', 7),

  (11, 'Manual de liquidación de seguridad social',
   'Parametrización de aportes a salud, pensión, ARL y parafiscales con validación de topes.',
   'Manual', 'SIESA Nómina', 'Seguridad Social', '1.5', 2026,
   '["seguridad social","aportes","arl","parafiscales"]',
   'documents/e1f2a3b4c5.pdf', 'manual-seguridad-social-v1.5.pdf', 'application/pdf', 1932456, 1, 733, 209,
   'publicado', '2026-08-20 10:30:00', '2026-08-20 10:30:00', '2026-08-20 10:30:00', 8),

  (12, 'Comunicado de cierre de año contable',
   'Instrucciones y fechas límite para el cierre del ejercicio y la generación de reportes oficiales.',
   'Comunicado', 'SIESA Enterprise', 'Módulo Financiero', '1.0', 2025,
   '["cierre","año contable","reportes","fechas limite"]',
   'documents/f3e4d5c6b7.pdf', 'comunicado-cierre-ano-contable.pdf', 'application/pdf', 372145, 1, 1128, 274,
   'publicado', '2025-11-28 07:30:00', '2025-11-28 07:30:00', '2025-11-28 07:30:00', 7),

  -- Borrador: no visible para clientes; sirve para probar el rol interno.
  (13, 'Manual de integración con nómina electrónica',
   'Documento en construcción: integración con el proveedor de nómina electrónica.',
   'Manual', 'SIESA Nómina', 'Liquidación', '0.9', 2026,
   '["nomina electronica","integracion"]',
   'documents/aa11bb22cc.pdf', 'borrador-nomina-electronica.pdf', 'application/pdf', 0, 1, 0, 0,
   'borrador', NULL, '2026-10-09 16:40:00', '2026-10-09 16:40:00', 6);

-- ---------------------------------------------------------------------
-- Documentos relacionados
-- ---------------------------------------------------------------------
INSERT INTO document_related (document_id, related_id) VALUES
  (1, 7), (7, 1), (1, 11), (11, 1), (1, 6), (6, 1),
  (2, 4), (4, 2), (3, 12), (12, 3), (3, 8), (8, 3),
  (4, 9), (9, 4), (5, 9), (9, 5), (3, 10), (10, 3);

-- ---------------------------------------------------------------------
-- Historial de versiones
-- ---------------------------------------------------------------------
INSERT INTO document_versions (document_id, version_number, pdf_path, original_name, detected_size, responsible_user_id, created_at) VALUES
  (1, 1, 'documents/90ab12cd34.pdf', 'manual-configuracion-nomina-v3.0.pdf', 2301120, 7, '2026-04-08 09:00:00'),
  (1, 2, 'documents/a1f9c2e40b.pdf', 'manual-configuracion-nomina-v3.2.pdf', 2418432, 8, '2026-09-15 09:00:00'),
  (2, 1, 'documents/b7d3aa518c.pdf', 'manual-facturacion-electronica-v2.5.pdf', 3187200, 6, '2026-07-10 08:30:00'),
  (3, 1, 'documents/c2e88f90d4.pdf', 'manual-cierre-contable-v2.1.pdf', 1876543, 7, '2026-06-22 10:00:00'),
  (6, 1, 'documents/ee55ff66aa.pdf', 'guia-configuracion-usuarios-v1.7.pdf', 1087654, 7, '2025-10-14 09:45:00'),
  (6, 2, 'documents/f1a2b3c4d5.pdf', 'guia-configuracion-usuarios-v1.8.pdf', 1120984, 7, '2026-05-18 11:05:00');

-- ---------------------------------------------------------------------
-- Solicitudes
-- ---------------------------------------------------------------------
INSERT INTO requests
  (id, consecutive, client_id, document_type, request_type, system_name, application_name, version_label, publication_year,
   title, description, reason, priority, notification_channel, status, assigned_to, estimated_at, related_document_id,
   production_instructions, created_at, updated_at)
VALUES
  (1, 'SOL-2026-0001', 1, 'Manual', 'Documento nuevo', 'SIESA Contabilidad', 'Cierre Contable', '2.1', 2026,
   'Manual de conciliación bancaria automática',
   'Necesitamos documentación del proceso de conciliación bancaria automática con extractos en formato OFX.',
   'El equipo contable no encuentra el procedimiento y lo requiere para el cierre mensual.',
   'Alta', 'ambos', 'En producción', 8, '2026-10-22 18:00:00', NULL,
   'Incluir ejemplos con dos bancos distintos y el detalle de la carga del extracto.',
   '2026-09-18 09:12:00', '2026-10-02 11:30:00'),

  (2, 'SOL-2026-0002', 2, 'Comunicado', 'Actualización', 'SIESA Enterprise', 'Módulo Financiero', NULL, 2026,
   'Actualización del comunicado de retenciones 2026',
   'El comunicado publicado no incluye las tablas de retención actualizadas de este año.',
   'El documento vigente quedó desactualizado tras el cambio normativo.',
   'Media', 'correo', 'Información adicional requerida', 6, '2026-10-15 18:00:00', 4,
   NULL, '2026-09-24 15:40:00', '2026-09-26 10:05:00'),

  (3, 'SOL-2026-0003', 3, 'Manual', 'Corrección', 'SIESA Cloud', 'API Gateway', '1.0', 2026,
   'Corrección en la guía de autenticación de la API',
   'La guía muestra un ejemplo de token que ya no es válido y confunde al equipo de integraciones.',
   'El ejemplo induce a error en la implementación.',
   'Media', 'aplicación', 'Aprobada', 6, '2026-10-14 18:00:00', 9,
   NULL, '2026-09-29 08:55:00', '2026-10-03 09:20:00'),

  (4, 'SOL-2026-0004', 4, 'Manual', 'Documento nuevo', 'SIESA Nómina', 'Liquidación', '3.2', 2026,
   'Manual de liquidación de prima de servicios',
   'Solicitamos el manual con el cálculo paso a paso de la prima de servicios y sus validaciones.',
   'Ingresaron nuevas analistas de nómina y no existe material de apoyo.',
   'Baja', 'ambos', 'Recibida', NULL, NULL, NULL,
   NULL, '2026-10-08 16:18:00', '2026-10-08 16:18:00'),

  (5, 'SOL-2026-0005', 1, 'Comunicado', 'Documento nuevo', 'SIESA Facturación', 'Resoluciones DIAN', NULL, 2026,
   'Comunicado de habilitación de rango de numeración',
   'Requerimos el instructivo para solicitar la habilitación de un nuevo rango de numeración ante la DIAN.',
   'Estamos por agotar el rango actual de facturación.',
   'Alta', 'ambos', 'Documento disponible', 7, '2026-09-30 18:00:00', 2,
   'Se anexa el paso a paso con capturas del portal de la DIAN.',
   '2026-08-25 11:02:00', '2026-09-26 17:45:00'),

  (6, 'SOL-2026-0006', 5, 'Manual', 'Documento nuevo', 'SIESA Facturación', 'Notas Crédito', '2.5', 2026,
   'Manual de generación de notas crédito',
   'Necesitamos el manual para emitir notas crédito parciales y totales.',
   'No hay documentación y el proceso se aprendió de forma empírica.',
   'Media', 'aplicación', 'En validación', 6, '2026-10-17 18:00:00', NULL,
   NULL, '2026-10-05 09:30:00', '2026-10-07 14:12:00'),

  (7, 'SOL-2026-0007', 2, 'Manual', 'Documento nuevo', 'SIESA Enterprise', 'Módulo de Compras', '1.8', 2025,
   'Manual de órdenes de compra',
   'Solicitamos el manual de creación, aprobación y cierre de órdenes de compra.',
   'El equipo de compras necesita formalizar el proceso.',
   'Baja', 'correo', 'Rechazada', 7, NULL, NULL,
   NULL, '2026-08-11 10:44:00', '2026-08-19 09:15:00'),

  (8, 'SOL-2026-0008', 3, 'Comunicado', 'Actualización', 'SIESA Cloud', 'Portal Web', NULL, 2026,
   'Actualización del comunicado de mantenimiento',
   'El comunicado de mantenimiento no incluye las nuevas fechas de la ventana programada.',
   'Las fechas cambiaron y el cliente necesita el documento actualizado.',
   'Alta', 'ambos', 'Cerrada', 6, '2026-09-05 18:00:00', 5,
   NULL, '2026-08-28 07:50:00', '2026-09-08 12:00:00');

-- ---------------------------------------------------------------------
-- Historial de las solicitudes
-- ---------------------------------------------------------------------
INSERT INTO request_history
  (request_id, previous_status, new_status, action_name, comment_text, visibility, responsible_user_id, created_at)
VALUES
  -- SOL-2026-0001 — En producción
  (1, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 1, '2026-09-18 09:12:00'),
  (1, 'Recibida', 'En validación', 'Cambio de estado', 'Estamos revisando la solicitud y el material existente.', 'cliente', 6, '2026-09-19 10:00:00'),
  (1, 'En validación', 'En validación', 'Asignación', 'Asignada a Paula Vega, especialista de cierre contable.', 'interno', 6, '2026-09-19 10:04:00'),
  (1, 'En validación', 'En validación', 'Comentario', '¿Podrías confirmarnos los dos bancos con los que trabajan actualmente?', 'cliente', 6, '2026-09-22 08:35:00'),
  (1, 'En validación', 'En validación', 'Comentario', 'Trabajamos con Banco de Bogotá y Davivienda.', 'cliente', 1, '2026-09-22 14:10:00'),
  (1, 'En validación', 'En producción', 'Envío a producción', 'Se aprueba la creación del manual y pasa a producción.', 'cliente', 6, '2026-10-02 11:30:00'),

  -- SOL-2026-0002 — Información adicional requerida
  (2, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 2, '2026-09-24 15:40:00'),
  (2, 'Recibida', 'En validación', 'Cambio de estado', 'Verificamos el alcance de la actualización solicitada.', 'cliente', 6, '2026-09-25 09:10:00'),
  (2, 'En validación', 'Información adicional requerida', 'Solicitud de información', '¿Nos confirmas si el cambio aplica también para el año gravable anterior?', 'cliente', 6, '2026-09-26 10:05:00'),
  (2, 'Información adicional requerida', 'Información adicional requerida', 'Comentario', 'Pendiente respuesta del cliente para continuar con la validación.', 'interno', 6, '2026-09-28 08:30:00'),

  -- SOL-2026-0003 — Aprobada
  (3, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 3, '2026-09-29 08:55:00'),
  (3, 'Recibida', 'En validación', 'Cambio de estado', 'Revisamos el ejemplo reportado en la guía.', 'cliente', 7, '2026-10-01 11:20:00'),
  (3, 'En validación', 'Aprobada', 'Cambio de estado', 'Se aprueba la corrección; se agenda para el próximo ciclo de publicación.', 'cliente', 7, '2026-10-03 09:20:00'),

  -- SOL-2026-0004 — Recibida
  (4, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 4, '2026-10-08 16:18:00'),

  -- SOL-2026-0005 — Documento disponible
  (5, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 1, '2026-08-25 11:02:00'),
  (5, 'Recibida', 'En validación', 'Cambio de estado', 'Validamos la disponibilidad del rango de numeración.', 'cliente', 6, '2026-08-26 09:00:00'),
  (5, 'En validación', 'En producción', 'Envío a producción', 'Aprobada y enviada a producción documental.', 'cliente', 6, '2026-08-28 10:30:00'),
  (5, 'En producción', 'Documento disponible', 'Publicación de documento', 'El documento quedó publicado y vinculado a la solicitud.', 'cliente', 7, '2026-09-26 17:45:00'),

  -- SOL-2026-0006 — En validación
  (6, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 5, '2026-10-05 09:30:00'),
  (6, 'Recibida', 'En validación', 'Cambio de estado', 'Revisamos si existe material previo reutilizable.', 'cliente', 6, '2026-10-07 14:12:00'),

  -- SOL-2026-0007 — Rechazada
  (7, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 2, '2026-08-11 10:44:00'),
  (7, 'Recibida', 'En validación', 'Cambio de estado', 'Revisamos la solicitud con el área de compras.', 'cliente', 7, '2026-08-14 15:00:00'),
  (7, 'En validación', 'Rechazada', 'Rechazo de solicitud', 'El manual ya existe en el repositorio interno; se compartirá por el canal habitual.', 'cliente', 7, '2026-08-19 09:15:00'),

  -- SOL-2026-0008 — Cerrada
  (8, NULL, 'Recibida', 'Solicitud registrada', 'Solicitud enviada por el cliente.', 'cliente', 3, '2026-08-28 07:50:00'),
  (8, 'Recibida', 'En validación', 'Cambio de estado', 'Confirmamos las nuevas fechas con infraestructura.', 'cliente', 6, '2026-08-31 08:20:00'),
  (8, 'En validación', 'Aprobada', 'Cambio de estado', 'Actualización aprobada.', 'cliente', 6, '2026-09-02 09:00:00'),
  (8, 'Aprobada', 'En producción', 'Envío a producción', 'Enviada a producción para actualizar el comunicado.', 'cliente', 6, '2026-09-03 10:15:00'),
  (8, 'En producción', 'Documento disponible', 'Publicación de documento', 'Comunicado actualizado y publicado.', 'cliente', 7, '2026-09-05 16:40:00'),
  (8, 'Documento disponible', 'Cerrada', 'Cierre de solicitud', 'El cliente confirmó la recepción. Se cierra la solicitud.', 'cliente', 6, '2026-09-08 12:00:00');

-- ---------------------------------------------------------------------
-- Notificaciones
-- ---------------------------------------------------------------------
INSERT INTO notifications (user_id, event_type, title, message, link_path, read_at, created_at) VALUES
  (6, 'solicitud', 'Nueva solicitud recibida: SOL-2026-0004', 'Sandra Ruiz ha enviado una nueva solicitud.', '/agent/requests/4', NULL, '2026-10-08 16:18:00'),
  (6, 'solicitud', 'Nueva solicitud recibida: SOL-2026-0006', 'Julián Gómez ha enviado una nueva solicitud.', '/agent/requests/6', '2026-10-06 08:00:00', '2026-10-05 09:30:00'),
  (6, 'estado', 'Solicitud SOL-2026-0003 aprobada', 'La corrección de la guía de API fue aprobada.', '/agent/requests/3', '2026-10-04 12:00:00', '2026-10-03 09:20:00'),
  (7, 'solicitud', 'Documento pendiente de publicación', 'La solicitud SOL-2026-0003 espera el ciclo de publicación.', '/agent/requests/3', NULL, '2026-10-03 09:21:00'),
  (8, 'solicitud', 'Producción asignada: SOL-2026-0001', 'Debes construir el Manual de conciliación bancaria automática.', '/agent/requests/1', NULL, '2026-10-02 11:30:00'),
  (1, 'solicitud', 'Solicitud SOL-2026-0005 registrada', 'Tu solicitud ha sido registrada exitosamente. Te notificaremos sobre su avance.', '/client/requests/5', '2026-08-25 12:00:00', '2026-08-25 11:02:00'),
  (1, 'estado', 'Solicitud SOL-2026-0005: Documento disponible', 'El comunicado solicitado ya está disponible en la biblioteca.', '/client/requests/5', NULL, '2026-09-26 17:45:00'),
  (1, 'estado', 'Solicitud SOL-2026-0001 en producción', 'Tu solicitud está en producción. Fecha estimada: 2026-10-22.', '/client/requests/1', NULL, '2026-10-02 11:30:00'),
  (2, 'estado', 'Solicitud SOL-2026-0002: Información adicional requerida', 'Necesitamos que confirmes un dato para continuar con tu solicitud.', '/client/requests/2', NULL, '2026-09-26 10:05:00'),
  (2, 'estado', 'Solicitud SOL-2026-0007 rechazada', 'El manual ya existe en el repositorio interno.', '/client/requests/7', '2026-08-20 09:00:00', '2026-08-19 09:15:00'),
  (3, 'estado', 'Solicitud SOL-2026-0008 cerrada', 'El cliente confirmó la recepción del comunicado actualizado.', '/client/requests/8', '2026-09-09 08:00:00', '2026-09-08 12:00:00'),
  (5, 'sistema', 'Bienvenido a la Biblioteca Virtual Siesa', 'Aquí encontrarás manuales, comunicados y el seguimiento de tus solicitudes.', '/client/dashboard', NULL, '2026-02-11 09:25:00');
