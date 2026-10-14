/// <reference types="vite/client" />

/**
 * Verdadero cuando el frontend se compila en modo demostración (sin backend),
 * por ejemplo al publicarlo en Vercel. Lo define `vite.config.ts`.
 */
declare const __DEMO_MODE__: boolean;
