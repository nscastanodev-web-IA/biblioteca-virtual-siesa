# Despliegue local con XAMPP

La aplicación (frontend compilado + API PHP + base de datos) corre completa sobre
**XAMPP** (Apache + MariaDB). No requiere iniciar Vite ni el servidor embebido de PHP.

## Requisitos

- XAMPP 8.2.x (Apache 2.4 + MariaDB 10.4 + PHP 8.2) instalado en `C:\xampp`.
- El código del proyecto en `C:\dev\biblioteca-virtual-siesa`.

## Arranque

1. Abrir **XAMPP Control Panel** (`C:\xampp\xampp-control.exe`).
   Apache y MySQL arrancan automáticamente (ver `[Autostart]` en `xampp-control.ini`).
2. Abrir el navegador en <http://localhost>.

- Panel: `http://localhost` sirve `frontend/dist` (build de producción).
- API: `http://localhost/api/v1/...` se enruta por *Alias* a `backend/public/index.php`.
- phpMyAdmin: <http://localhost/phpmyadmin>.

## Configuración aplicada en Apache

En `C:\xampp\apache\conf\httpd.conf`:

```apache
DocumentRoot "C:/dev/biblioteca-virtual-siesa/frontend/dist"
<Directory "C:/dev/biblioteca-virtual-siesa/frontend/dist">
    Options Indexes FollowSymLinks Includes ExecCGI
    AllowOverride All
    Require all granted
</Directory>

Alias /api "C:/dev/biblioteca-virtual-siesa/backend/public"
<Directory "C:/dev/biblioteca-virtual-siesa/backend/public">
    Options -Indexes +FollowSymLinks
    AllowOverride None
    Require all granted
    FallbackResource /api/index.php
</Directory>
```

El `Alias /api` + `FallbackResource` preserva `REQUEST_URI`, por lo que el router
del backend sigue viendo rutas como `/api/v1/auth/login`. Al ser el mismo origen,
no hay CORS y la cookie de sesión funciona sin configuración adicional.

## Base de datos

- Motor: MariaDB 10.4.32 (incluida en XAMPP), puerto `3306`.
- Bases creadas al montar: `biblioteca_siesa`.
- Usuario de la app: `biblioteca` / `biblioteca_dev` con privilegios sobre `biblioteca_siesa`.

Creación desde cero:

```powershell
C:\xampp\mysql\bin\mysql.exe -u root -e "DROP DATABASE IF EXISTS biblioteca_siesa;"
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 -e "source C:/dev/biblioteca-virtual-siesa/database/schema.sql"
C:\xampp\mysql\bin\mysql.exe -u root --default-character-set=utf8mb4 -e "source C:/dev/biblioteca-virtual-siesa/database/seed.sql"
```

## Variables de entorno

En `backend/.env` (no versionado):

```
APP_URL=http://localhost
FRONTEND_URL=http://localhost
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=biblioteca_siesa
DB_USERNAME=biblioteca
DB_PASSWORD=biblioteca_dev
```

## Actualizar el frontend

Tras cambios en `frontend/src`, recompilar y Apache servirá el nuevo build:

```powershell
cd C:\dev\biblioteca-virtual-siesa\frontend
corepack pnpm build
```
