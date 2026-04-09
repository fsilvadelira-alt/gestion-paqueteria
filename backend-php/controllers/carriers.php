<?php
requireAuth();
$pdo = getDB();

if ($method === 'GET') {
    jsonResponse($pdo->query("SELECT * FROM Carriers ORDER BY name ASC")->fetchAll());
}
if ($method === 'POST') {
    requireAdmin();
    $stmt = $pdo->prepare("INSERT INTO Carriers (name) VALUES (?)");
    $stmt->execute([$body['name']]);
    $id = $pdo->lastInsertId();
    jsonResponse(['id' => $id, 'name' => $body['name']], 201);
}
if ($method === 'PUT' && $id) {
    requireAdmin();
    $pdo->prepare("UPDATE Carriers SET name = ? WHERE id = ?")->execute([$body['name'], $id]);
    jsonResponse(['id' => $id, 'name' => $body['name']]);
}
if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Carriers WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Paquetería eliminada']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
