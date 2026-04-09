<?php
requireAuth();
$pdo = getDB();

if ($method === 'GET') {
    jsonResponse($pdo->query("SELECT * FROM Logistics ORDER BY name ASC")->fetchAll());
}
if ($method === 'POST') {
    requireAdmin();
    $stmt = $pdo->prepare("INSERT INTO Logistics (name) VALUES (?)");
    $stmt->execute([$body['name']]);
    jsonResponse(['id' => $pdo->lastInsertId(), 'name' => $body['name']], 201);
}
if ($method === 'PUT' && $id) {
    requireAdmin();
    $pdo->prepare("UPDATE Logistics SET name = ? WHERE id = ?")->execute([$body['name'], $id]);
    jsonResponse(['id' => $id, 'name' => $body['name']]);
}
if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Logistics WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Eliminado']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
