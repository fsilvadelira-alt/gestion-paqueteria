<?php
requireAuth();
$pdo = getDB();

if ($method === 'GET') {
    $rows = $pdo->query("SELECT * FROM Companies ORDER BY name ASC")->fetchAll();
    jsonResponse($rows);
}
if ($method === 'POST') {
    requireAdmin();
    $name = trim($body['name'] ?? '');
    if (!$name) jsonResponse(['message' => 'El nombre es obligatorio'], 400);
    $exists = $pdo->prepare("SELECT id FROM Companies WHERE name = ?");
    $exists->execute([$name]);
    if ($exists->fetchColumn()) jsonResponse(['message' => 'Ya existe una empresa con ese nombre'], 400);
    $pdo->prepare("INSERT INTO Companies (name) VALUES (?)")->execute([$name]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $name], 201);
}
if ($method === 'PUT' && $id) {
    requireAdmin();
    $name = trim($body['name'] ?? '');
    if (!$name) jsonResponse(['message' => 'El nombre es obligatorio'], 400);
    $exists = $pdo->prepare("SELECT id FROM Companies WHERE name = ? AND id != ?");
    $exists->execute([$name, $id]);
    if ($exists->fetchColumn()) jsonResponse(['message' => 'Ya existe una empresa con ese nombre'], 400);
    $pdo->prepare("UPDATE Companies SET name = ? WHERE id = ?")->execute([$name, $id]);
    jsonResponse(['id' => $id, 'name' => $name]);
}
if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Companies WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Empresa eliminada']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
