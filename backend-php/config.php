<?php
// ============================================================
// Configuración de la Base de Datos MySQL
// Llenar con las credenciales reales de HostGator
// ============================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'TU_USUARIO_CPANEL_nombrebd');    // ← cambiar
define('DB_USER', 'TU_USUARIO_CPANEL_dbuser');       // ← cambiar
define('DB_PASS', 'TU_PASSWORD_BD');                  // ← cambiar

// Clave secreta para firmar tokens JWT (cámbiala por algo largo y aleatorio)
define('JWT_SECRET', 'packflow_secreto_super_largo_y_seguro_2024');

// URL del frontend (para CORS)
define('FRONTEND_URL', 'https://rp.icautomatizacion.com');
