# Matriz de Trazabilidad — Emily Designs

**Repo:** https://github.com/Marco-Gonzalez26/EmilyDesingsApp — `main` + tags `v1.0.0` `d331aba`, `v1.1.0` `cb687be`
**Mención QA/Diseño/Recolección:** Emily Chiriboga, Doris Lopez, sin commits, revisoras

| Requisito / Historia | EC ruta:línea | Issue / PR GitHub | Commit | Responsable | Revisora mención | Evidencia |
|----------------------|------------------|-------------------|--------|-------------|--------------------|-----------|
| Configurar monorepo y gitignore | `.gitignore:1`, `README.md:1` | #1 / PR #2 | `b5fa4b3` chore + `e185b6f` chore #1 | Marco Gonzalez | Emily Chiriboga, validación estructura | `git show e185b6f --stat` |
| Dependencias backend | `backend/requirements.txt:1` | #1 / PR #2 | `e185b6f` chore #1 | Marco Gonzalez | — | `git show e185b6f --stat` |
| Config Ionic/Capacitor | `frontend/capacitor.config.ts:1`, `frontend/angular.json:1` | #1 / PR #2 | `e185b6f` chore #1 | Marco Gonzalez | Doris Lopez, diseño | `git show e185b6f --stat` |
| Auth JWT y usuarios | `app/utils/auth_security.py:1`, `app/api/routers/auth.py:1` | PR #4 | `909e020` feat | Marco Gonzalez | Emily, QA flujo login | `git show 909e020 --stat` |
| Catálogo, carrito, órdenes, inventario | `app/services/product_service.py:1`, `app/api/routers/products.py:1`, `app/api/routers/orders.py:1` | #3 / PR #6 | `4f0a8d9` feat #3 | Marco Gonzalez | Doris, catálogo | `git show 4f0a8d9 --stat` |
| Migración base recomendación | `alembic/versions/a1b2c3d4e5f6:1` | #3 / PR #6 | `4f0a8d9` feat #3 | Marco Gonzalez | — | `git log --oneline --grep=catalog` |
| Recomendación híbrida y dashboard | `app/ml/inference.py:1`, `app/services/recomendacion_service.py:1`, `app/ml/artifacts/modelo_recomendacion_v1.2.joblib` | #7 / PR #8 | `2473231` feat #7 | Marco Gonzalez | Emily, recolección preferencias | `git show 2473231 --stat` |
| Tests backend | `backend/tests/test_auth_service.py:1` | #9 / PR #10 | `f5eb328` test #9 | Marco Gonzalez | — | `pytest backend/tests/` |
| Core frontend y auth UI | `frontend/src/app/app.routes.ts:1`, `features/auth/login/login.ts:1` | #11 / PR #12 | `a7004e2` feat #11 | Marco Gonzalez | Emily, QA flujo login | `git show a7004e2 --stat` |
| Flujo de compra frontend | `features/catalog/product-list/product-list.ts:1`, `features/checkout/checkout.component.ts:1` | #13 / PR #14 | `5193ae5` feat #13 + `9dc255c` feat #13 | Marco Gonzalez | Doris, catálogo | `git show 9dc255c --stat` |
| Zona de usuario | `features/profile/profile.component.ts:1`, `features/para-ti/para-ti.page.ts:1`, `features/home/home.component.ts:1` | #15 / PR #16 | `25124a1` + `81e17a6` + `82ca481` feat #15 | Marco Gonzalez | Emily, Para Ti | `git show 82ca481 --stat` |
| Panel admin y Android | `features/admin/products/admin-product-form.component.ts:1`, `frontend/android/app/src/main/AndroidManifest.xml:1` | #17 / PR #18 | `e719c63` feat #17 + `4fd1d61` chore #17 | Marco Gonzalez | Doris, diseño | `git show 4fd1d61 --stat` |
| Endpoint interacciones | `app/api/routers/interacciones.py:1`, migración `f6a7b8c9d0e1` | #19 / PR #20 | `591a3ef` feat #19 | Marco Gonzalez | — | `git show 591a3ef --stat` |
| 2FA TOTP backend | `app/utils/crypto.py:1`, migraciones totp `c4d5e6f7a8b9`, `d4e6f7a8c9b0`, `e5f6a7b8c9d0` | #21 / PR #22 | `d101082` feat #21 | Marco Gonzalez | — | `git show d101082 --stat` |
| Página Favoritos | `features/favorites/favorites.page.ts:1` | #23 / PR #24 | `a2ce945` feat #23 | Marco Gonzalez | — | `git show a2ce945 --stat` |
| Onboarding y LOPDP | `shared/components/preferencias-onboarding/preferencias-onboarding.component.ts:1`, `shared/components/terminos-modal/terminos-modal.component.ts:1` | #25 / PR #26 | `5ed8e20` feat #25 | Marco Gonzalez | Emily, preferencias | `git show 5ed8e20 --stat` |
| 2FA UX cliente y admin | `features/auth/verify-2fa/verify-2fa.component.ts:1`, `features/admin/configuracion/configuracion.component.ts:1` | #27 / PR #28 | `3530346` + `2ef97ad` + `20d2854` feat #27 | Marco Gonzalez | — | `git show 20d2854 --stat` |
| Baseline v1.1.0 | Todo lo anterior | #1 a #27 | `v1.1.0` anotado en `cb687be` | Marco Gonzalez | Emily, Doris, mención QA | `git tag -n`, `git log --decorate` |
