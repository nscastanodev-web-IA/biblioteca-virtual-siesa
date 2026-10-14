# Publicar la demo en Vercel

Esta guía publica **solo la interfaz** (frontend) como demo estática en
[Vercel](https://vercel.com). El backend PHP + MariaDB **no** se despliega: en su
lugar, la app usa datos de ejemplo (`frontend/src/data/mockData.ts`) mediante una
API simulada que intercepta las llamadas a `/api/v1`
(`frontend/src/services/demoApi.ts`).

> Vercel no ejecuta PHP ni ofrece MySQL, por eso la demo funciona sin backend.
> Para publicar la aplicación real (con login y documentos reales) se necesita un
> hosting con PHP + MySQL (ver `docs/XAMPP.md` para el entorno local).

## Accesos de demostración

| Rol     | Correo               | Contraseña |
| ------- | -------------------- | ---------- |
| Cliente | `cliente@siesa.com`  | `demo1234` |
| Agente  | `agente@siesa.com`   | `demo1234` |

También hay botones de acceso rápido en la pantalla de inicio de sesión.

## Cómo se activa el modo demostración

`frontend/vite.config.ts` define la constante `__DEMO_MODE__`:

```ts
const DEMO_MODE = process.env.VERCEL === '1' || process.env.VITE_DEMO_MODE === 'true'
```

- En Vercel, la variable `VERCEL=1` existe durante el build, así que la demo se
  activa automáticamente.
- En local puedes forzarla con `VITE_DEMO_MODE=true` (por ejemplo,
  `pnpm build --mode demo`).
- Fuera de Vercel el comportamiento normal (API real `/api/v1`) no cambia.

## Pasos para publicar

1. **Sube el proyecto a GitHub** (rama `main`).
2. En Vercel: **Add New… → Project → Import Git Repository** y elige el repositorio.
3. En la configuración del proyecto:
   - **Root Directory:** `frontend`  ← obligatorio (el repo es un monorepo; no hay
     `package.json` en la raíz).
   - **Framework Preset:** `Vite` (se detecta solo).
   - **Build Command:** `pnpm build` (por defecto).
   - **Output Directory:** `dist` (por defecto).
   - Instalar dependencias con pnpm lo detecta Vercel por `pnpm-lock.yaml`.
4. Pulsa **Deploy**. Al terminar obtendrás una URL pública
   (por ejemplo `https://biblioteca-virtual-siesa.vercel.app`).

La configuración concreta está en `frontend/vercel.json`.

## Alcance y limitaciones de la demo

- **Sí funciona:** inicio de sesión (cliente/agente), biblioteca y filtros, ficha
  de documento con visor de PDF, solicitudes (listar, crear, cambiar estado,
  comentar), notificaciones y perfil, y el recorrido guiado.
- **No hay datos reales:** todo son datos de ejemplo en el navegador. Al recargar
  se reinician las listas (se conservan la sesión y los indicadores de recorrido,
  guardados en `localStorage`).
- **Los documentos** abren un PDF de ejemplo (`frontend/public/demo/documento.pdf`).
- **Las suscripciones, correos y archivos subidos** no se procesan.

## Desactivar o ampliar

- Para volver a la API real, publica el frontend en el mismo dominio que el
  backend PHP (como en XAMPP) y **no** definas `VITE_DEMO_MODE`.
- Para una versión real en la nube, aloja el backend PHP + MySQL en un proveedor
  con soporte PHP (Railway, Render, un VPS o un hosting compartido) y ajusta
  `VITE_API_URL` y `FRONTEND_URL`/CORS según corresponda.
