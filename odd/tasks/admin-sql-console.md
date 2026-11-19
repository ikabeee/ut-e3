Consola SQL en el panel del sysadmin, con lectura y escritura.
Riesgo: items 1 (escribe datos) y 2 (permisos, datos personales). Rama `feature/admin-sql-console`.

## Specs

- S1: "Necesito una pantalla para poder hacer consultas SQL desde el panel de admin"
- S2: Lectura y escritura (decisión L2): SELECT, INSERT, UPDATE y DELETE. Antes de ejecutar una escritura, la pantalla pide una confirmación explícita.
- S3: Solo el sysadmin (decisión L2), con su sesión (2FA incluido). Cada consulta queda en la bitácora de auditoría.

## Tasks

- [x] T1 S1 S2 S3: sección /admin/sql con validación, confirmación de escrituras, límite de filas y bitácora. Ruta: logic-worker y luego verificación independiente.

## Log

- L1 (usuario): "Necesito una pantalla para poder hacer consultas SQL desde el panel de admin"
- L2 (usuario): ¿Qué puede hacer? -> "Lectura y escritura"; ¿Quién puede usarla? -> "Solo el sysadmin".
