<?php
// ============================================================
// JWT implementado sin librerías externas
// ============================================================

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_create(array $payload): string {
    $header  = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode($payload));
    $sig     = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$sig";
}

function jwt_verify(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $sig] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    if (!hash_equals($expected, $sig)) return null;

    $data = json_decode(base64url_decode($payload), true);
    if (!$data) return null;

    // Verificar expiración
    if (isset($data['exp']) && $data['exp'] < time()) return null;

    return $data;
}

// ============================================================
// Middleware de autenticación
// ============================================================
function requireAuth(): array {
    $headers = getallheaders();
    $auth    = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!str_starts_with($auth, 'Bearer ')) {
        jsonResponse(['message' => 'No autorizado, no hay token'], 401);
    }

    $token = substr($auth, 7);
    $user  = jwt_verify($token);

    if (!$user) {
        jsonResponse(['message' => 'No autorizado, token fallido'], 401);
    }

    return $user; // ['id' => ..., 'role' => ...]
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'Admin') {
        jsonResponse(['message' => 'No autorizado, se requiere rol de Administrador'], 403);
    }
    return $user;
}
