<?php
$user = requireAuth();
$pdo  = getDB();

if ($method === 'GET') {
    $rows = $pdo->query("
        SELECT e.*, u.id as user_id, u.name as user_name
        FROM Expenses e LEFT JOIN Users u ON e.userId = u.id
        ORDER BY e.date DESC
    ")->fetchAll();
    $result = array_map(function($r) {
        $r['user'] = $r['user_id'] ? ['id' => $r['user_id'], 'name' => $r['user_name']] : null;
        unset($r['user_id'], $r['user_name']);
        return $r;
    }, $rows);
    jsonResponse($result);
}

if ($method === 'POST') {
    $stmt = $pdo->prepare("INSERT INTO Expenses (description, amount, type, date, isFacturado, invoiceNumber, notes, userId) VALUES (?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $body['description'] ?? '', $body['amount'] ?? 0,
        $body['type'] ?? 'gasto',   $body['date'] ?? date('Y-m-d'),
        $body['isFacturado'] ?? 0,  $body['invoiceNumber'] ?? null,
        $body['notes'] ?? null,     $user['id'],
    ]);
    jsonResponse(['id' => $pdo->lastInsertId()] + $body, 201);
}

if ($method === 'PUT' && $id) {
    $pdo->prepare("UPDATE Expenses SET description=?, amount=?, type=?, date=?, isFacturado=?, invoiceNumber=?, notes=? WHERE id=?")
        ->execute([$body['description'], $body['amount'], $body['type'], $body['date'], $body['isFacturado'] ?? 0, $body['invoiceNumber'] ?? null, $body['notes'] ?? null, $id]);
    jsonResponse(['id' => $id] + $body);
}

if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM Expenses WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Gasto eliminado']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
