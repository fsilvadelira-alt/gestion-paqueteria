# 📦 PackFlow - Sistema de Gestión y Control de Paquetería

PackFlow es una plataforma web desarrollada para gestionar y controlar paquetes y gastos de paquetería en una empresa o departamento.

## 🛠️ Tecnologías y Requisitos

**Importante:** Debes tener instalado **Node.js** (incluye npm) en tu sistema para ejecutar el proyecto. Descárgalo desde: [https://nodejs.org](https://nodejs.org).

- **Frontend**: React, Vite, Chart.js, Lucide Icons, Vanilla CSS (Diseño moderno dark mode).
- **Backend**: Node.js, Express, Sequelize (ORM), JWT Auth.
- **Base de Datos**: SQLite (viene configurado por defecto para facilitar pruebas, no requiere configuración extra). Soporte nativo para PostgreSQL.

---

## 🚀 Instalación y Ejecución Local

### Paso 1: Configurar e Iniciar el Backend

1. Abre una terminal y navega a la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el archivo semilla para crear el usuario Administrador y algunos datos de prueba iniciales de paqueterías:
   ```bash
   node seed.js
   ```
4. Inicia el servidor backend (se mantendrá corriendo en el puerto 5000):
   ```bash
   npm run dev
   ```

*(Opcional - Cambio a PostgreSQL)*: Si deseas usar PostgreSQL, abre `backend/.env` y descomenta las líneas de configuración de BD (agrega tus credenciales). Cambia `DB_DIALECT=postgres`.

### Paso 2: Configurar e Iniciar el Frontend

1. Abre *otra* terminal y navega a la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias de React:
   ```bash
   npm install
   ```
3. Inicia la aplicación web:
   ```bash
   npm run dev
   ```

Visita `http://localhost:5173` en tu navegador para ver la plataforma.

---

## 🔑 Accesos Iniciales

Tras ejecutar el script `node seed.js`, se crea una cuenta de administrador para que puedas acceder al sistema:

- **Correo electrónico**: `admin@packflow.com`
- **Contraseña**: `admin123`

---

## ✨ Características Principales de esta Entrega

- **Dashboard Visual**: Gráficas con Chart.js de paquetes por estado, reportes y métricas automáticas mensuales.
- **Gestión Completa (CRUD)**:
  - Paqueterías (Ej. DHL, FedEx).
  - Destinatarios por área/departamento.
  - Paquetes con número de guía único, asignados a un destinatario, con cambios de estado y costo asociado.
  - Gastos adicionales.
- **Seguridad**: Autenticación Bearer Token con JWT, contraseñas encriptadas con bcryptjs, y middlewares de roles.
- **Diseño Ultra Moderno**: Interfaz rica en Vanilla CSS, variables de entorno, sistema Glassmorphism, y Dark Mode premium enfocado a Data Management.

## Notas

Las funciones de exportación (Excel, PDF) se prepararon a nivel modelo. Se pueden añadir utilidades de front-end como `jspdf` y `xlsx` fácilmente en una futura iteración agregando botones a las tablas existentes.
