# Emily Designs App

Aplicación móvil para la gestión y comercialización de prendas con recomendación personalizada basada en preferencias e historial de interacción, desarrollada para la tienda **Emily Designs** en Quevedo.

## Descripción

El sistema permite a los clientes explorar el catálogo de prendas de la tienda y recibir recomendaciones ajustadas a sus gustos y su comportamiento previo dentro de la aplicación. El backend procesa las interacciones del usuario para generar sugerencias mediante un modelo de recomendación entrenado con **PyTorch**, mientras que el frontend ofrece una experiencia móvil nativa a través de **Ionic** y **Capacitor**.

## Estructura del proyecto

```text
emily-designs-app/
├── frontend/   # Ionic + Capacitor (Android)
└── backend/    # FastAPI + PyTorch + PostgreSQL
```

### Frontend

Aplicación móvil construida con **Ionic** y **Capacitor**, empaquetada para Android. Contiene las pantallas de catálogo, perfil de usuario, historial de interacción y recomendaciones.

### Backend

API construida con **FastAPI**. Gestiona la autenticación de usuarios, el catálogo de productos, el registro de interacciones y el modelo de recomendación. Usa **PostgreSQL** como base de datos, junto con **SQLAlchemy** para el manejo de modelos y consultas.

## Tecnologías

### Frontend

- Ionic
- Capacitor
- Tailwind CSS
- Android

### Backend

- Python
- FastAPI
- PyTorch
- PostgreSQL
- SQLAlchemy

## Requisitos previos

- Node.js y npm
- Python 3.10 o superior
- PostgreSQL instalado y en ejecución
- Android Studio configurado para Capacitor

## Instalación

### Backend

1. Ubicarse en la carpeta `backend`:

   ```bash
   cd backend
   ```

2. Crear un entorno virtual:

   ```bash
   python -m venv venv
   ```

3. Activar el entorno virtual:

   ```bash
   source venv/bin/activate
   ```

   En Windows:

   ```bash
   venv\Scripts\activate
   ```

4. Instalar dependencias:

   ```bash
   pip install -r requirements.txt
   ```

5. Configurar las variables de entorno copiando el archivo de ejemplo:

   ```bash
   cp .env.example .env
   ```

   Completar en `.env` los valores de conexión a PostgreSQL y demás credenciales necesarias.

6. Ejecutar el servidor:

   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Ubicarse en la carpeta `frontend`:

   ```bash
   cd frontend
   ```

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Ejecutar en modo desarrollo:

   ```bash
   ionic serve
   ```

4. Compilar y sincronizar con Android:

   ```bash
   ionic build
   npx cap sync android
   npx cap open android
   ```

## Convención de commits

El proyecto sigue una convención de commits basada en prefijos:

- `chore` para tareas de configuración y estructura
- `docs` para cambios de documentación
- `feat` para nuevas funcionalidades
- `fix` para corrección de errores

Ejemplo:

```bash
feat: add product recommendation endpoint
```
