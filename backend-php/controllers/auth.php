<?php
$pdo = getDB();

// GET /api/auth/health — Healthcheck
if ($method === 'GET' && $sub === 'health') {
    jsonResponse(['status' => 'ok']);
}

// GET /api/auth — Lista todos los usuarios (lo que espera el frontend en Users.jsx)
if ($method === 'GET' && ($sub === null || $sub === '')) {
    requireAuth();
    $users = $pdo->query("SELECT id, name, email, role, createdAt FROM Users ORDER BY name ASC")->fetchAll();
    jsonResponse($users);
}

// PUT /api/auth/:id — Editar usuario (frontend: api.put(`/auth/${editId}`, payload))
if ($method === 'PUT' && $id !== null && $sub === null) {
    requireAdmin();
    $fields = [];
    $vals   = [];

    if (!empty($body['name']))  { $fields[] = 'name = ?';  $vals[] = $body['name']; }
    if (!empty($body['email'])) { $fields[] = 'email = ?'; $vals[] = $body['email']; }
    if (!empty($body['role']))  { $fields[] = 'role = ?';  $vals[] = $body['role']; }
    if (!empty($body['password'])) {
        $fields[] = 'password = ?';
        $vals[]   = password_hash($body['password'], PASSWORD_BCRYPT);
    }

    if (!$fields) jsonResponse(['message' => 'Nada que actualizar'], 400);
    $vals[] = $id;
    $pdo->prepare("UPDATE Users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($vals);
    jsonResponse(['message' => 'Usuario actualizado']);
}

// DELETE /api/auth/:id — Eliminar usuario (frontend: api.delete(`/auth/${id}`))
if ($method === 'DELETE' && $id !== null && $sub === null) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Users WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Usuario eliminado']);
}

// POST /api/auth/login
if ($method === 'POST' && $sub === 'login') {
    $email    = $body['email'] ?? '';
    $password = $body['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM Users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $exp   = time() + (30 * 24 * 3600); // 30 días
        $token = jwt_create(['id' => $user['id'], 'role' => $user['role'], 'exp' => $exp]);
        jsonResponse([
            'id'    => $user['id'],
            'name'  => $user['name'],
            'email' => $user['email'],
            'role'  => $user['role'],
            'token' => $token,
        ]);
    }
    jsonResponse(['message' => 'Email o contraseña inválidos'], 401);
}

// POST /api/auth/register (solo Admin)
if ($method === 'POST' && $sub === 'register') {
    requireAdmin();
    $name     = $body['name'] ?? '';
    $email    = $body['email'] ?? '';
    $password = $body['password'] ?? '';
    $role     = $body['role'] ?? 'User';

    $exists = $pdo->prepare("SELECT id FROM Users WHERE email = ?");
    $exists->execute([$email]);
    if ($exists->fetchColumn()) jsonResponse(['message' => 'El usuario ya existe'], 400);

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $hash, $role]);
    $newId = $pdo->lastInsertId();

    $exp   = time() + (30 * 24 * 3600);
    $token = jwt_create(['id' => $newId, 'role' => $role, 'exp' => $exp]);
    jsonResponse(['id' => $newId, 'name' => $name, 'email' => $email, 'role' => $role, 'token' => $token], 201);
}

// GET /api/auth/users
if ($method === 'GET' && $sub === 'users') {
    requireAuth();
    $users = $pdo->query("SELECT id, name, email, role, createdAt FROM Users ORDER BY name ASC")->fetchAll();
    jsonResponse($users);
}

// PUT /api/auth/users/:id
if ($method === 'PUT' && $sub === 'users' && is_numeric($subId)) {
    requireAdmin();
    $userId = (int)$subId;
    $fields = [];
    $vals   = [];

    if (!empty($body['name']))  { $fields[] = 'name = ?';  $vals[] = $body['name']; }
    if (!empty($body['email'])) { $fields[] = 'email = ?'; $vals[] = $body['email']; }
    if (!empty($body['role']))  { $fields[] = 'role = ?';  $vals[] = $body['role']; }
    if (!empty($body['password'])) {
        $fields[] = 'password = ?';
        $vals[]   = password_hash($body['password'], PASSWORD_BCRYPT);
    }

    if (!$fields) jsonResponse(['message' => 'Nada que actualizar'], 400);
    $vals[] = $userId;
    $pdo->prepare("UPDATE Users SET " . implode(', ', $fields) . " WHERE id = ?")->execute($vals);
    jsonResponse(['message' => 'Usuario actualizado']);
}

// DELETE /api/auth/users/:id
if ($method === 'DELETE' && $sub === 'users' && is_numeric($subId)) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Users WHERE id = ?")->execute([(int)$subId]);
    jsonResponse(['message' => 'Usuario eliminado']);
}

jsonResponse(['message' => 'Ruta de auth no encontrada'], 404);
