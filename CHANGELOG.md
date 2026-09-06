# Changelog Emily Designs App

## v1.2.0
Fecha: 06-09-2026

### Agregado
- Endpoint `POST /api/interacciones` para señales `clic` y `búsqueda` del modelo
- Autenticación en dos pasos TOTP compatible con Google Authenticator
- Secreto TOTP cifrado con clave fuera del código
- Límite de 5 intentos por minuto y un solo uso por código
- Página Mis Favoritos con tab propio
- Onboarding bloqueante de 12 estilos que alimenta el modelo
- Consentimiento LOPDP obligatorio en el registro
- Hoja reutilizable de activación 2FA con QR y clave manual
- Autogestión de 2FA en perfil y configuración admin
- Documentos GCS en `docs`

## v1.1.0
Fecha: 05-09-2026

### Agregado
- Flujo de tienda y zona de usuario en su perfil
- Historial de órdenes y edición de perfil con preferencias
- Recomendaciones Para Ti con modelo híbrido
- Landing home con botón Nosotros
- Panel admin completo con layout y servicios
- Plataforma Android con Capacitor

## v1.0.0
Fecha: 05-09-2026

### Agregado
- Tienda comprable de extremo a extremo
- Autenticación JWT con `bcrypt` y validación de cédula
- Catálogo con `tiene_stock`, filtros y detalle
- Carrito con reserva de stock y checkout
- Motor de recomendación híbrido con modelo `v1.2` versionado
- Dashboard admin, reportes PDF y favoritos
- Suite de tests backend en verde
