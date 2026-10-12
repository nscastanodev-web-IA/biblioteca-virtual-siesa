# Biblioteca Virtual Siesa

Aplicación web para gestión de biblioteca digital, solicitudes de documentos y administración. Desarrollada con **React + TypeScript + Vite + Tailwind CSS** (frontend) y **PHP 8.2 + PDO + MariaDB** (backend), con autenticación por sesiones HTTPOnly, CSRF, roles (cliente/agente) y subida pública autorizada de archivos PDF.

## Estructura del proyecto

```text
biblioteca-virtual-siesa/
├── frontend/   # React 19 + Vite 8 + Tailwind CSS v4
│   ├── src/    # Componentes, páginas, store, servicios, tipos
│   └── public/
├── backend/    # PHP 8.2 (autocarga PSR-4, sin vendor)
│   ├── public/ # Punto de entrada index.php
│   ├── src/    # Controladores, servicios, repos, middleware, soporte
│   ├── config/ # Rutas, entorno
│   └── storage/
├── database/   # schema.sql y seed.sql
└── docs/       # API.md
```

## Requisitos

- [Node.js](https://nodejs.org/) 20+ (recomendado 22+). Node 24.14.1 funciona.
- [pnpm](https://pnpm.io/) 10+ (se usa vía corepack).
- [PHP](https://www.php.net/) 8.2.x con extensiones: `pdo_mysql`, `mbstring`, `openssl`, `json`.
- [MariaDB](https://mariadb.org/) 10.11+ / 13+.
- [Git](https://git-scm.com/).

## Configuración rápida

### 1) Clonar repositorio

```bash
git clone https://github.com/nscastanodev-web-IA/biblioteca-virtual-siesa.git
cd biblioteca-virtual-siesa
```

### 2) Base de datos (MariaDB)

Crear base de datos, usuario y cargar esquema + datos demo.

```sql
CREATE DATABASE biblioteca_siesa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'biblioteca'@'localhost' IDENTIFIED BY 'biblioteca_dev';
GRANT ALL PRIVILEGES ON biblioteca_siesa.* TO 'biblioteca'@'localhost';
FLUSH PRIVILEGES;
```

Desde Windows (mariadb.exe) o cualquier cliente:

```bash
mariadb -u root -p biblioteca_siesa < database/schema.sql
mariadb -u root -p biblioteca_siesa < database/seed.sql
```

### 3) Backend (PHP)

Copiar `.env.example` y ajustar credenciales.

```bash
cd backend
cp .env.example .env
```

Editar `.env` según tu entorno:

```env
APP_ENV=local
APP_DEBUG=true
BASE_URL=http://localhost:8000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=biblioteca_siesa
DB_USER=biblioteca
DB_PASS=biblioteca_dev
DB_CHARSET=utf8mb4

SESSION_NAME=siesa_biblioteca_session
SESSION_SECURE=false
SESSION_HTTPONLY=true
SESSION_SAMESITE=Lax
CSRF_TOKEN_NAME=X-CSRF-Token

UPLOAD_MAX_SIZE=26214400
ALLOWED_MIME_TYPES=application/pdf
ALLOWED_EXTENSIONS=pdf
STORAGE_PATH=storage/documents
```

Levantar servidor PHP embebido:

```bash
php -S 127.0.0.1:8000 public/index.php
```

Verificar health: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 4) Frontend (React + Vite)

```bash
cd frontend
corepack enable
corepack pnpm install
corepack pnpm run dev
```

Abrir [http://localhost:5173](http://localhost:5173)

## Usuarios demo

| Rol | Correo | Contraseña |
|---|---|---|
| Cliente | `cliente@siesa.com` | `demo1234` |
| Agente | `agente@siesa.com` | `demo1234` |

## Comandos útiles

Frontend:

```bash
corepack pnpm run dev      # Servidor desarrollo
corepack pnpm run build    # Build producción
corepack pnpm run preview  # Preview build
corepack pnpm run typecheck # TypeScript
```

Backend:

```bash
php -S 127.0.0.1:8000 public/index.php  # API local
```

## Características

- API REST con respuestas `{ data, meta }` y snake_case/transformación a camelCase según contrato.
- Autenticación con sesiones + CSRF para operaciones mutantes.
- Roles: cliente (crear solicitudes, descargar, perfil) / agente (gestionar solicitudes, documentos, notificaciones).
- Subida/descarga autorizada de PDFs.
- Flujo completo: solicitudes → seguimiento → vinculación a documento → notificaciones.
- Estados, historial, comentarios (internos/externos), asignación, producción, cancelación (cliente cuando corresponde).

## Notas técnicas

- Frontend apunta a `/api/v1` vía proxy de Vite; en producción configurar reverse proxy o `VITE_API_URL`.
- Backend usa PSR-4 (`App\` → `src/`), sin Composer requerido (autocarga simple).
- Archivos subidos van a `backend/storage/documents/` (fuera de `public/`).
- CSRF: header `X-CSRF-Token` requerido para POST/PATCH/PUT/DELETE autenticados; `GET /auth/me` devuelve `csrfToken`.

## Documentación

- [docs/API.md](docs/API.md) — Contrato REST completo
- [backend/README.md](backend/README.md) — Detalles backend
- [database/schema.sql](database/schema.sql) — Esquema
- [database/seed.sql](database/seed.sql) — Datos demo

## Licencia

Uso interno / educativo.
