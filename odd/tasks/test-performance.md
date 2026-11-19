Bajar el tiempo de las pruebas locales y del CI sin perder cobertura. Todo en un solo PR (decisión L2).
Riesgo: item 2 (parámetros de hash de contraseñas) e item 5 (CI).

## Specs

- S1: "Que podriamos hacer para optimizar el tiempo de los tests?" -> plan acordado: 1) scrypt barato solo en las pruebas, 2) base plantilla en vez de migrar en cada suite, 3) `--onlyChanged` / `--findRelatedTests` para el trabajo local, 4) CI en paralelo con caché y Jest repartido en shards, 5) cobertura fuera del camino crítico del PR.
- S2: medir antes y después; el PR reporta los tiempos reales (suite local y job de CI) y las 15 suites más lentas.
- S3: producción no cambia: el costo real de scrypt (N = 2^17) se sigue usando fuera de las pruebas, y una prueba verifica esos parámetros.

## Tasks

- [ ] T1 S1-S3 — medir, aplicar los 5 cambios y volver a medir. logic-worker. rama `chore/test-performance`

## Log

- L1 (usuario): "Que podriamos hacer para optimizar el tiempo de los tests?" / "Aproximadamente cuanto tiempo se ahorraria?"
- L2 (usuario): "Ve haciendo esos fixes todo en un solo pr"
