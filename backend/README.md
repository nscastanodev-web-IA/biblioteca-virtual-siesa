# Backend PHP 8.2 propuesto

No se sustituye PHP por Node.js. Esta carpeta documenta la estructura que debe implementar la API:

```text
backend/
  public/index.php
  src/
    Controllers/
    Services/
    Models/
    Repositories/
    Validation/
    Middleware/
    Routes/
    Security/
  config/
  storage/documents/
  tests/
```

- **Controllers** traducen HTTP a casos de uso; no contienen SQL.
- **Services** implementan transiciones, permisos, consecutivos y notificaciones.
- **Repositories** usan PDO y consultas preparadas.
- **Validation** valida entrada, PDF real y límites configurables.
- **Middleware** autentica, aplica roles, CSRF y límites de intentos.
- **Security** centraliza sesiones, `password_hash`, nombres aleatorios y auditoría.

Ver `docs/API.md` y `database/schema.sql`. El directorio de documentos debe quedar fuera de la raíz pública; toda descarga pasa por un controlador autorizado.
