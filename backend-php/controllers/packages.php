<?php
$user = requireAuth();
$pdo  = getDB();

// Helper para hidratar un paquete con sus relaciones
function hydratePackage(array $row): array {
    $row['carrier']          = $row['carrier_id']   ? ['id' => $row['carrier_id'],   'name' => $row['carrier_name']]   : null;
    $row['logisticsCompany'] = $row['logistics_id']  ? ['id' => $row['logistics_id'],  'name' => $row['logistics_name']]  : null;
    $row['finalRecipient']   = $row['recipient_id']  ? ['id' => $row['recipient_id'],  'name' => $row['recipient_name']]  : null;
    $row['receiver']         = $row['receiver_id']   ? ['id' => $row['receiver_id'],   'name' => $row['receiver_name']]   : null;
    $row['deliverer']        = $row['deliverer_id']  ? ['id' => $row['deliverer_id'],  'name' => $row['deliverer_name']]  : null;
    $row['shippingAdmin']    = $row['shipadmin_id']  ? ['id' => $row['shipadmin_id'],  'name' => $row['shipadmin_name']]  : null;
    foreach (['carrier_id','carrier_name','logistics_id','logistics_name','recipient_id','recipient_name',
              'receiver_id','receiver_name','deliverer_id','deliverer_name','shipadmin_id','shipadmin_name'] as $k) {
        unset($row[$k]);
    }
    return $row;
}

$selectSQL = "
    SELECT p.*,
        c.id as carrier_id, c.name as carrier_name,
        l.id as logistics_id, l.name as logistics_name,
        r.id as recipient_id, r.name as recipient_name,
        u1.id as receiver_id, u1.name as receiver_name,
        u2.id as deliverer_id, u2.name as deliverer_name,
        u3.id as shipadmin_id, u3.name as shipadmin_name
    FROM Packages p
    LEFT JOIN Carriers c ON p.carrierId = c.id
    LEFT JOIN Logistics l ON p.logisticsCompanyId = l.id
    LEFT JOIN Recipients r ON p.recipientId = r.id
    LEFT JOIN Users u1 ON p.receivedBy = u1.id
    LEFT JOIN Users u2 ON p.deliveredBy = u2.id
    LEFT JOIN Users u3 ON p.shippingAdminId = u3.id
";

// GET /api/packages  — listar todos
if ($method === 'GET' && !$id && $sub !== 'search') {
    $rows = $pdo->query($selectSQL . " ORDER BY p.createdAt DESC")->fetchAll();
    jsonResponse(array_map('hydratePackage', $rows));
}

// GET /api/packages/search/:tracking
if ($method === 'GET' && $sub === 'search' && $subId) {
    $stmt = $pdo->prepare($selectSQL . " WHERE p.trackingNumber = ?");
    $stmt->execute([$subId]);
    $row = $stmt->fetch();
    if (!$row) jsonResponse(['message' => 'Paquete no encontrado'], 404);
    jsonResponse(hydratePackage($row));
}

// POST /api/packages
if ($method === 'POST') {
    $b = $body;
    $stmt = $pdo->prepare("
        INSERT INTO Packages
        (trackingNumber, description, status, purchaseType, amountMXN, amountUSD, isBilled, invoiceNumber,
         shippingCost, shippingIsBilled, shippingInvoiceNumber, registrationDate, notes,
         carrierId, logisticsCompanyId, recipientId, receivedBy)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([
        $b['trackingNumber'] ?? null, $b['description'] ?? null,
        $b['status'] ?? 'En camino',  $b['purchaseType'] ?? null,
        $b['amountMXN'] ?? 0,         $b['amountUSD'] ?? 0,
        $b['isBilled'] ?? 0,          $b['invoiceNumber'] ?? null,
        $b['shippingCost'] ?? 0,      $b['shippingIsBilled'] ?? 0,
        $b['shippingInvoiceNumber'] ?? null,
        $b['registrationDate'] ?? date('Y-m-d'),
        $b['notes'] ?? null,          $b['carrierId'] ?? null,
        $b['logisticsCompanyId'] ?? null, $b['recipientId'] ?? null,
        $user['id'],
    ]);
    $newId = $pdo->lastInsertId();
    $stmt2 = $pdo->prepare($selectSQL . " WHERE p.id = ?");
    $stmt2->execute([$newId]);
    jsonResponse(hydratePackage($stmt2->fetch()), 201);
}

// PUT /api/packages/:id
if ($method === 'PUT' && $id) {
    $stmt = $pdo->prepare("SELECT * FROM Packages WHERE id = ?");
    $stmt->execute([$id]);
    $pkg = $stmt->fetch();
    if (!$pkg) jsonResponse(['message' => 'Paquete no encontrado'], 404);

    $b = $body;
    $unboxingStates = ['Listo para entregar', 'Incorrecto', 'Defectuoso'];
    if (!empty($b['status']) && in_array($b['status'], $unboxingStates) && !in_array($pkg['status'], $unboxingStates)) {
        if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo los administradores pueden hacer el unboxing'], 403);
    }

    if (!empty($b['status']) && $b['status'] === 'Recibido' && $pkg['status'] !== 'Recibido') {
        $b['receptionDate'] = date('Y-m-d H:i:s');
        $b['receivedBy']    = $user['id'];
    }
    if (!empty($b['status']) && $b['status'] === 'Entregado' && $pkg['status'] !== 'Entregado') {
        $b['deliveryDate'] = date('Y-m-d H:i:s');
        $b['deliveredBy']  = $user['id'];
    }
    if (!empty($b['shippingCostAssigned'])) {
        $b['shippingAssignedAt'] = date('Y-m-d H:i:s');
        $b['shippingAdminId']    = $user['id'];
    }

    $allowed = ['trackingNumber','description','status','purchaseType','amountMXN','amountUSD','isBilled',
                'invoiceNumber','shippingCost','shippingIsBilled','shippingInvoiceNumber',
                'shippingCostAssigned','shippingAssignedAt','shippingAdminId','registrationDate',
                'receptionDate','deliveryDate','notes','carrierId','logisticsCompanyId','recipientId',
                'receivedBy','deliveredBy'];
    $sets = []; $vals = [];
    foreach ($allowed as $col) {
        if (array_key_exists($col, $b)) { $sets[] = "$col = ?"; $vals[] = $b[$col]; }
    }
    if ($sets) {
        $vals[] = $id;
        $pdo->prepare("UPDATE Packages SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);
    }

    $stmt2 = $pdo->prepare($selectSQL . " WHERE p.id = ?");
    $stmt2->execute([$id]);
    jsonResponse(hydratePackage($stmt2->fetch()));
}

// DELETE /api/packages/:id
if ($method === 'DELETE' && $id) {
    requireAdmin();
    $pdo->prepare("DELETE FROM Packages WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Paquete eliminado']);
}

jsonResponse(['message' => 'Ruta no encontrada'], 404);
