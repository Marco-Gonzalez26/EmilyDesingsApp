# Acta de Trabajo — Gestión de la Configuración GCS

**Proyecto:** Emily Designs App — Gestión y comercialización de prendas con recomendación personalizada
**Tienda:** Emily Designs, Quevedo — 2026
**Metodología:** Kanban, elegida
**Repositorio:** https://github.com/Marco-Gonzalez26/EmilyDesingsApp
**Baseline:** `v1.1.0` en `cb687be`, release de flujo de tienda y zona de usuario en su perfil
**Rama principal:** `main`
**Fecha de historial:** 06-09-2026

## 1. Roles asumidos

> Desarrollo ejecutado individualmente por **Marco Gonzalez** cubriendo todos los roles GCS. **Emily Chiriboga** y **Doris Lopez** figuran únicamente como mención en calidad de QA/Validación, diseño de interfaz y recolección de información con levantamiento en tienda, sin commits directos.

| Rol | Responsable | Entregable / Evidencia verificable |
|-----|-------------|------------------------------------|
| **Líder de Configuración** | **Marco Gonzalez** | `.gitignore` reforzado en `b5fa4b3`, ramas `main` y `develop`, `README.md`, estructura monorepo `frontend/` y `backend/`, tags `v1.0.0` y `v1.1.0` |
| **Responsable de Trazabilidad** | **Marco Gonzalez** | Historial por features con smart commits en `git log --oneline --graph`, `backend/alembic/versions/` con 7 migraciones, `app/models/models.py` sincronizado con cada cambio de DB |
| **Responsable de Control de Cambios** | **Marco Gonzalez** | Cambios aprobados con Issue y PR: #1 setup, #3 catálogo, #7 recomendación, #9 tests, #11 core auth, #13 tienda, #15 zona usuario, #17 admin, #19 interacciones, #21 2FA backend, #23 favoritos, #25 onboarding, #27 2FA UX |
| **QA / Validación — mención** | **Emily Chiriboga, Doris Lopez** | Validación de interfaz en pantallas `catalog/`, `para-ti/`, `home/`, recolección de información en tienda, revisión de catálogo y criterios de recomendación. Sin commits, constan como revisoras en `matriz-trazabilidad.md` |

## 2. Elementos de Configuración controlados

- `backend/main.py:1` con 22 routers, `backend/app/models/models.py` con `Usuario` y `TotpRecoveryCode`, `backend/app/ml/inference.py:1` con híbrido content y SVD, `backend/requirements.txt` con `pyotp`, `qrcode`, `slowapi`, `cryptography`
- `frontend/capacitor.config.ts:1`, `frontend/src/app/app.routes.ts:1`, `frontend/src/app/core/services/` con 21 servicios, `frontend/android/` sin generados, `backend/app/ml/artifacts/modelo_recomendacion_v1.2.joblib` versionado por reproducibilidad

## 3. Acuerdos

- Convención de commits: `chore|docs|feat|fix|test` con descripción en imperativo en minúsculas en inglés y referencia de issue — verificable en `git log --oneline --reverse`
- `.gitignore` excluye `frontend/node_modules/`, `backend/venv/`, `backend/.env`, `frontend/android/build/`, `frontend/android/app/src/main/assets/`, `*.apk`; en `backend/app/ml/artifacts/` solo se versiona el modelo activo `v1.2`, el resto queda untracked
- Todo `git add` con rutas específicas, nunca `git add .`
- Regla permanente: cada cambio de DB ajusta el modelo acorde
- Ramas `fix/` para correcciones y `docs/` para documentación, sin commits directos a `main` ni `develop`
