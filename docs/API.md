# Contrato REST — Biblioteca Virtual Siesa

Base: `/api/v1`. Todas las respuestas son JSON salvo descargas. La autenticación recomendada para la aplicación web es una cookie de sesión `HttpOnly`, `Secure`, `SameSite=Lax` y token CSRF para operaciones de escritura.

## Formato de respuesta

```json
{ "data": {}, "meta": {} }
```

Errores:

```json
{ "message": "Mensaje seguro y comprensible", "errors": { "campo": ["Detalle"] } }
```

## Autenticación

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| POST | `/auth/register` | Público | Registrar únicamente clientes |
| POST | `/auth/login` | Público | Autenticar sin seleccionar rol |
| POST | `/auth/logout` | Autenticado | Invalidar sesión |
| GET | `/auth/me` | Autenticado | Usuario y permisos actuales |
| POST | `/auth/forgot-password` | Público | Solicitar recuperación |
| POST | `/auth/reset-password` | Público con token | Restablecer contraseña |
| POST | `/auth/verify-email` | Público con token | Verificar correo |

El registro rechaza roles enviados por el cliente, correos duplicados y archivos. PHP cifra contraseñas con `password_hash(..., PASSWORD_DEFAULT)`.

## Documentos

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/documents` | Autenticado | Buscar y filtrar publicados |
| GET | `/documents/{id}` | Autenticado | Detalle y relacionados |
| GET | `/documents/{id}/preview` | Autenticado | Vista segura del PDF |
| GET | `/documents/{id}/download` | Autenticado | Descargar y registrar métrica |
| POST | `/documents/{id}/feedback` | Cliente | Registrar utilidad |
| POST | `/documents` | Agente | Crear documento con `multipart/form-data` |
| PATCH | `/documents/{id}` | Agente | Editar metadatos |
| POST | `/documents/{id}/versions` | Agente | Reemplazar PDF y crear versión |
| PATCH | `/documents/{id}/status` | Agente | Publicar o desactivar |

El servidor acepta solo PDF, comprueba firma `%PDF`, MIME con `finfo`, integridad, tamaño límite y genera un nombre interno aleatorio. El formato y el tamaño nunca se reciben como datos confiables del formulario.

Filtros de `GET /documents`: `q`, `type`, `system`, `app`, `version`, `year`, `published_from`, `published_to`, `flag`, `page`.

## Solicitudes

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/requests` | Cliente/Agente | Cliente: solo propias; agente: según permisos |
| POST | `/requests` | Cliente | Crear y generar consecutivo |
| GET | `/requests/{id}` | Propietario/Agente | Detalle e historial visible |
| POST | `/requests/{id}/comments` | Propietario/Agente | Responder; `internal` solo para agentes |
| PATCH | `/requests/{id}/status` | Agente | Cambiar estado con transición validada |
| PATCH | `/requests/{id}/assignment` | Agente | Asignar responsable y fecha |
| POST | `/requests/{id}/production` | Agente | Enviar a producción |
| PATCH | `/requests/{id}/document` | Agente | Vincular documento |

Las consultas del cliente siempre incluyen `WHERE client_id = :authenticated_user_id`. Los comentarios internos se eliminan de la serialización para clientes.

## Notificaciones y perfil

- `GET /notifications`
- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`
- `GET /profile`
- `PATCH /profile`
- `PATCH /profile/password`
- `PATCH /profile/preferences`
- `PATCH /profile/onboarding`

## Sustitución de los datos simulados

1. Configure `VITE_API_URL`.
2. Mantenga `src/services/api.ts` como única frontera HTTP.
3. Sustituya las mutaciones y lecturas de `AppContext` por los servicios, conservando allí autenticación, tema y caché global.
4. No importe `src/data/mockData.ts` desde componentes nuevos.
5. Pruebe primero autenticación y control de roles; después documentos, solicitudes y notificaciones.
