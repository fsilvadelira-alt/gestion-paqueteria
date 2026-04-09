<?php
requireAuth();
$pdo = getDB();

if ($method === 'GET') {
    jsonResponse($pdo->query("SELECT * FROM Zones ORDER BY name ASC")->fetchAll());
}
if ($method === 'POST') {
    requireAdmin();
    $name = trim($body['name'] ?? '');
    if (!$name) jsonResponse(['message' => 'El nombre es obligatorio'], 400);
    $pdo->prepare("INSERT INTO Zones (name, companyId) VALUES (?, ?)")->execute([$name, $body['companyId'] ?? null]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $name, 'companyId' => $body['companyId'] ?? null], 201);
}
if ($method === 'PUT' && $id) {
    requireAdmin();
    $name = trim($body['name'] ?? '');
    if (!$name) jsonResponse(['message' => 'El nombre es obligatorio'], 400);
    $zone = $pdo->prepare("SELECT companyId FROM Zones WHERE id = ?");
    $zone->execute([$id]);
    $current = $zone->fetch();
    $exists = $pdo->prepare("SELECT id FROM Zones WHERE name = ? AND companyId = ? AND id != ?");
    $exists->execute([$name, $current['companyId'], $id]);
    if ($exists->fetchColumn()) jsonResponse(['message' => 'Ya existe un departamento con ese nombre en esta empresa'], 400);
    $pdo->prepare("UPDATE Zones SET name = ? WHERE id = ?")->execute([$name, $id]);
    jsonResponse(['id' => $id, 'name' => $name]);
}
if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Zones WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Zona eliminada']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
