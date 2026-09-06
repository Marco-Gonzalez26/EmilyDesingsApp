# Matriz de Decisión — Scrum vs Kanban

**Proyecto:** Emily Designs, Quevedo, 2026 — Monorepo `frontend` Ionic+Capacitor y `backend` FastAPI+PyTorch+PostgreSQL
**Metodología elegida:** **Kanban**, decisión previa, esta matriz solo justifica
**Evaluador:** Marco Gonzalez, desarrollo individual, ritmo variable por carga académica, multitecnología en paralelo
**Evidencia:** historial `develop` por features con smart commits, tags `v1.0.0` `d331aba` y `v1.1.0` `cb687be`

## Criterios de 1 a 5, 5 es óptimo

| Criterio | Scrum de 1 a 5 | Kanban de 1 a 5 | Fundamento en mi contexto, no generalidad |
|----------|----------------|-----------------|---------------------------------------------|
| **Control de cambios** | 3 | **5** | Scrum exige sprint planning con commit fijo; mi carga académica es variable y hago smart commits por unidad funcional, caso `5193ae5` catálogo y `9dc255c` carrito bajo el mismo Issue #13, fuera de sprint. Kanban permite tomar un Issue y moverlo de ToDo a Done sin esperar sprint, con trazado directo en el mensaje |
| **Visibilidad** | 3 | **5** | Con un tablero Kanban veo flujo continuo de backend PyTorch y frontend Ionic en paralelo, con ramas `feature/`, `fix/` y `docs/` separadas. Scrum board por sprint ocultaría WIP multitecnología |
| **Trazabilidad** | 3 | **5** | Kanban vincula cada EC con Issue y commit sin ceremonia: migración `a1b2c3d4e5f6` entra en `4f0a8d9` bajo Issue #3, y el endpoint `POST /api/interacciones` entra en `591a3ef` bajo Issue #19. Scrum trazaría vía backlog de sprint, capa innecesaria para 1 dev |
| **Prevención de riesgos** | 4 | **4** | Empate. Scrum mitiga vía retrospectiva; Kanban vía WIP limit y políticas explícitas, caso `.gitignore` reforzado que evita credenciales y regla de sincronizar modelo con cada cambio de DB. En solo, WIP limit es no mezclar concerns en el mismo commit |
| **Adaptación al equipo** | 2 | **5** | Equipo de 1 dev cubriendo todos los roles GCS. Scrum requiere roles y ceremonias diarias inviables solo. Kanban se adapta a ritmo intermitente y a compilar Android cuando hay ventana académica |

**Totales:** **Scrum 15** | **Kanban 24, Kanban superior**

## Justificación

Kanban se alinea mejor porque el proyecto es individual con ritmo variable por carga académica y paralelismo multitecnología en FastAPI, PyTorch, PostgreSQL, Ionic y Capacitor. Permite flujo continuo sin sprints artificiales, visualiza WIP real entre backend y frontend, y traza cada cambio atómico con Issue, commit y tag `v1.1.0` sin overhead de ceremonias Scrum que exigirían un equipo y cadencia fija inexistente en este contexto.
