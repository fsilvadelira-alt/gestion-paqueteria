<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

// ============================================================
// CORS — permite peticiones desde el frontend React
// ============================================================
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: " . FRONTEND_URL);
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=utf-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================
// Helper: respuesta JSON
// ============================================================
function jsonResponse(mixed $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ============================================================
// Router basado en PATH_INFO o Query param (_ruta)
// ============================================================
$method = $_SERVER['REQUEST_METHOD'];
$path   = trim($_GET['_ruta'] ?? $_SERVER['PATH_INFO'] ?? '/', '/');
$parts  = explode('/', $path);
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

// Ej: auth/login → parts = ['auth','login']
//     packages/5 → parts = ['packages','5']
$resource = $parts[0] ?? ''; // auth, packages, carriers, etc.
$id       = isset($parts[1]) && is_numeric($parts[1]) ? (int)$parts[1] : null;
$sub      = $parts[1] ?? null; // rutas especiales ej: 'health'
$subId    = $parts[2] ?? null;

// ============================================================
// Cargar el controller correspondiente
// ============================================================
match ($resource) {
    'auth'       => require __DIR__ . '/controllers/auth.php',
    'carriers'   => require __DIR__ . '/controllers/carriers.php',
    'logistics'  => require __DIR__ . '/controllers/logistics.php',
    'recipients' => require __DIR__ . '/controllers/recipients.php',
    'packages'   => require __DIR__ . '/controllers/packages.php',
    'expenses'   => require __DIR__ . '/controllers/expenses.php',
    'dashboard'  => require __DIR__ . '/controllers/dashboard.php',
    'companies'  => require __DIR__ . '/controllers/companies.php',
    'zones'      => require __DIR__ . '/controllers/zones.php',
    'quotes'     => require __DIR__ . '/controllers/quotes.php',
    'exports'    => require __DIR__ . '/controllers/exports.php',
    default      => jsonResponse(['message' => 'Ruta no encontrada'], 404),
};
