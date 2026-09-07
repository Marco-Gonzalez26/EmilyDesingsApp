# Mini-informe de Estado — Emily Designs, máx. 10 líneas

**Baseline:** `v1.1.0` en `cb687be` — FastAPI+Postgres+PyTorch híbrido, Ionic Capacitor Android, 19 routers, admin panel, flujo compra, 2FA TOTP y zona de usuario.
**Cambios aprobados:** features #1 a #27 con smart commits, releases `v1.0.0` `d331aba` y `v1.1.0` `cb687be`, rama `docs/gcs-deliverables` en curso para `v1.2.0`.
**EC afectados:** `app/api/routers/interacciones.py:1`, `app/utils/crypto.py:1`, `features/favorites/favorites.page.ts:1`, `shared/components/twofa-setup/twofa-setup.component.ts:1`.
**Problema frecuente:** modelo `Usuario` sin columna `totp_secret_encrypted` mapeada con commit que no persistía, más instancias `uvicorn` duplicadas en puerto 8000.
**Acción mejora:** regla permanente de sincronizar modelo con cada cambio de DB, instancia única sin recarga, `smart commits` por unidad funcional y `git add` con rutas exactas.

> Fuente verificable: `git tag -n`, `git show 591a3ef --stat`, `git show d101082 --stat`, `git remote -v` con `Marco-Gonzalez26/EmilyDesingsApp`.

> **Nota — Investigación modelos:** Bug inicial `v1.1` mostraba métricas planas por evaluar siempre con `K=15`; al corregir recalculando `K=5,10,15`, `Hit@10` es **0.15 = 15%** y `Hit@15` **0.16 = 16%**. Para la investigación se generó un **dataset basado en la base de datos de productos para simular muchos productos** con 300 ítems, permitiendo comparar escenarios y elegir el mejor para la recomendación; decisión para producción con catálogo real de 50 productos: mantener `Hit Rate` competitivo y `Precision@10` sin saturar al cliente.
