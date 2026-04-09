<?php
requireAuth();
$pdo = getDB();

if ($method === 'GET') {
    $rows = $pdo->query("
        SELECT r.*, c.id as company_id, c.name as company_name,
               z.id as zone_id, z.name as zone_name
        FROM Recipients r
        LEFT JOIN Companies c ON r.companyId = c.id
        LEFT JOIN Zones z ON r.zoneId = z.id
        ORDER BY r.name ASC
    ")->fetchAll();

    // Anidar los objetos relacionados para compatibilidad con el frontend
    $result = array_map(function($r) {
        $r['company'] = $r['company_id'] ? ['id' => $r['company_id'], 'name' => $r['company_name']] : null;
        $r['zone']    = $r['zone_id']    ? ['id' => $r['zone_id'],    'name' => $r['zone_name']]    : null;
        unset($r['company_id'], $r['company_name'], $r['zone_id'], $r['zone_name']);
        return $r;
    }, $rows);
    jsonResponse($result);
}

if ($method === 'POST') {
    requireAdmin();
    $stmt = $pdo->prepare("INSERT INTO Recipients (name, email, department, companyId, zoneId) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([
        $body['name'] ?? null,
        $body['email'] ?? null,
        $body['department'] ?? null,
        $body['companyId'] ?? null,
        $body['zoneId'] ?? null,
    ]);
    jsonResponse(['id' => $pdo->lastInsertId()] + $body, 201);
}

if ($method === 'PUT' && $id) {
    requireAdmin();
    $pdo->prepare("UPDATE Recipients SET name=?, email=?, department=?, companyId=?, zoneId=? WHERE id=?")
        ->execute([$body['name'] ?? null, $body['email'] ?? null, $body['department'] ?? null, $body['companyId'] ?? null, $body['zoneId'] ?? null, $id]);
    jsonResponse(['id' => $id] + $body);
}

if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Recipients WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Destinatario eliminado']);
}
jsonResponse(['message' => 'Ruta no encontrada'], 404);
