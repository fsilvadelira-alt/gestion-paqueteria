<?php
$user = requireAuth();
$pdo  = getDB();

// Helper para hidratar cotización
function hydrateQuote(array $row): array {
    $row['recipient'] = $row['rec_id'] ? [
        'id'      => $row['rec_id'],
        'name'    => $row['rec_name'],
        'company' => $row['cmp_id'] ? ['id' => $row['cmp_id'], 'name' => $row['cmp_name']] : null,
        'zone'    => $row['zon_id'] ? ['id' => $row['zon_id'], 'name' => $row['zon_name']] : null,
    ] : null;
    $row['sender'] = $row['sender_id'] ? ['name' => $row['sender_name']] : null;
    foreach (['rec_id','rec_name','cmp_id','cmp_name','zon_id','zon_name','sender_id','sender_name'] as $k) unset($row[$k]);
    return $row;
}

$selectSQL = "
    SELECT q.*,
        r.id as rec_id, r.name as rec_name,
        c.id as cmp_id, c.name as cmp_name,
        z.id as zon_id, z.name as zon_name,
        u.id as sender_id, u.name as sender_name
    FROM Quotes q
    LEFT JOIN Recipients r ON q.recipientId = r.id
    LEFT JOIN Companies c ON r.companyId = c.id
    LEFT JOIN Zones z ON r.zoneId = z.id
    LEFT JOIN Users u ON q.sentBy = u.id
";

// GET /api/quotes
if ($method === 'GET' && !$id && !$sub) {
    $rows = $pdo->query($selectSQL . " WHERE q.status NOT IN ('Perdido','Cerrado') ORDER BY q.commitmentDate ASC")->fetchAll();
    jsonResponse(array_map('hydrateQuote', $rows));
}

// GET /api/quotes/history
if ($method === 'GET' && $sub === 'history') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $rows = $pdo->query($selectSQL . " WHERE q.status IN ('Perdido','Cerrado') ORDER BY q.updatedAt DESC")->fetchAll();
    $quotes = array_map('hydrateQuote', $rows);
    // Anidar wonQuote
    foreach ($quotes as &$q) {
        $wq = $pdo->prepare("SELECT wq.*, GROUP_CONCAT(p.id) as pkg_ids FROM WonQuotes wq LEFT JOIN WonQuotePackages wqp ON wq.id = wqp.wonQuoteId LEFT JOIN Packages p ON wqp.packageId = p.id WHERE wq.quoteId = ? GROUP BY wq.id");
        $wq->execute([$q['id']]);
        $wonRow = $wq->fetch();
        $q['wonQuote'] = $wonRow ?: null;
        if ($wonRow) {
            $oes = $pdo->prepare("SELECT * FROM OperationalExpenses WHERE wonQuoteId = ? ORDER BY date DESC");
            $oes->execute([$wonRow['id']]);
            $q['wonQuote']['operationalExpenses'] = $oes->fetchAll();
        }
    }
    jsonResponse($quotes);
}

// POST /api/quotes
if ($method === 'POST') {
    $b = $body;
    if (empty($b['sentAt']))    unset($b['sentAt']);
    if (empty($b['sentBy']))    unset($b['sentBy']);
    if (empty($b['recipientId'])) unset($b['recipientId']);
    if (empty($b['folio']))     unset($b['folio']);

    $stmt = $pdo->prepare("INSERT INTO Quotes (folio, description, status, amount, currency, commitmentDate, sentAt, sentBy, internalNotes, recipientId) VALUES (?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $b['folio'] ?? null, $b['description'] ?? null,
        $b['status'] ?? 'Borrador', $b['amount'] ?? null,
        $b['currency'] ?? 'MXN', $b['commitmentDate'] ?? null,
        $b['sentAt'] ?? null, $b['sentBy'] ?? null,
        $b['internalNotes'] ?? null, $b['recipientId'] ?? null,
    ]);
    $newId = $pdo->lastInsertId();
    $stmt2 = $pdo->prepare($selectSQL . " WHERE q.id = ?");
    $stmt2->execute([$newId]);
    jsonResponse(hydrateQuote($stmt2->fetch()), 201);
}

// PUT /api/quotes/:id
if ($method === 'PUT' && $id && !$sub) {
    $stmt = $pdo->prepare("SELECT * FROM Quotes WHERE id = ?");
    $stmt->execute([$id]);
    $quote = $stmt->fetch();
    if (!$quote) jsonResponse(['message' => 'Cotización no encontrada'], 404);

    $b = $body;
    if (isset($b['sentAt']) && $b['sentAt'] === '') $b['sentAt'] = null;
    if (empty($b['sentBy'])) $b['sentBy'] = null;
    if (empty($b['recipientId'])) $b['recipientId'] = null;

    if (!empty($b['status']) && $b['status'] === 'Enviado' && $quote['status'] !== 'Enviado') {
        if (empty($b['sentAt'])) $b['sentAt'] = date('Y-m-d H:i:s');
        if (empty($b['sentBy'])) $b['sentBy'] = $user['id'];
    }

    $pdo->prepare("UPDATE Quotes SET folio=?, description=?, status=?, amount=?, currency=?, commitmentDate=?, sentAt=?, sentBy=?, internalNotes=?, recipientId=? WHERE id=?")
        ->execute([$b['folio'] ?? $quote['folio'], $b['description'] ?? $quote['description'], $b['status'] ?? $quote['status'], $b['amount'] ?? $quote['amount'], $b['currency'] ?? $quote['currency'], $b['commitmentDate'] ?? $quote['commitmentDate'], $b['sentAt'], $b['sentBy'], $b['internalNotes'] ?? null, $b['recipientId'], $id]);

    $stmt2 = $pdo->prepare($selectSQL . " WHERE q.id = ?");
    $stmt2->execute([$id]);
    jsonResponse(hydrateQuote($stmt2->fetch()));
}

// DELETE /api/quotes/:id
if ($method === 'DELETE' && $id && !$sub) {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $pdo->prepare("DELETE FROM Quotes WHERE id = ?")->execute([$id]);
    jsonResponse(['message' => 'Cotización eliminada']);
}

// POST /api/quotes/:id/won  — Marcar como ganada
if ($method === 'POST' && $id && $sub === 'won') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $stmt = $pdo->prepare("SELECT * FROM Quotes WHERE id = ?"); $stmt->execute([$id]); $quote = $stmt->fetch();
    if (!$quote) jsonResponse(['message' => 'Cotización no encontrada'], 404);
    if ($quote['status'] !== 'Enviado') jsonResponse(['message' => 'Solo cotizaciones Enviadas pueden marcarse Ganadas'], 400);
    if (empty($body['category'])) jsonResponse(['message' => 'La categoría es obligatoria'], 400);

    $existing = $pdo->prepare("SELECT id FROM WonQuotes WHERE quoteId = ?"); $existing->execute([$id]);
    if ($existing->fetchColumn()) {
        $pdo->prepare("UPDATE Quotes SET status='Ganado' WHERE id=?")->execute([$id]);
        jsonResponse(['quote' => $quote, 'wonQuote' => $existing->fetch()]);
    }
    $pdo->prepare("INSERT INTO WonQuotes (quoteId, category, purchaseOrder, wonAt, wonBy) VALUES (?,?,?,NOW(),?)")
        ->execute([$id, $body['category'], $body['purchaseOrder'] ?? null, $user['id']]);
    $pdo->prepare("UPDATE Quotes SET status='Ganado' WHERE id=?")->execute([$id]);
    jsonResponse(['message' => 'Cotización marcada como Ganada']);
}

// POST /api/quotes/:id/lost
if ($method === 'POST' && $id && $sub === 'lost') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $stmt = $pdo->prepare("SELECT status FROM Quotes WHERE id = ?"); $stmt->execute([$id]); $quote = $stmt->fetch();
    if (!$quote || $quote['status'] !== 'Enviado') jsonResponse(['message' => 'Solo cotizaciones Enviadas pueden marcarse Perdidas'], 400);
    $pdo->prepare("UPDATE Quotes SET status='Perdido', lostAt=NOW(), lostReason=? WHERE id=?")->execute([$body['lostReason'] ?? null, $id]);
    jsonResponse(['message' => 'Cotización marcada como Perdida']);
}

// POST /api/quotes/:id/recover
if ($method === 'POST' && $id && $sub === 'recover') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $stmt = $pdo->prepare("SELECT status FROM Quotes WHERE id = ?"); $stmt->execute([$id]); $quote = $stmt->fetch();
    if (!$quote || $quote['status'] !== 'Perdido') jsonResponse(['message' => 'Solo cotizaciones Perdidas pueden recuperarse'], 400);
    $pdo->prepare("UPDATE Quotes SET status='Enviado', lostAt=NULL, lostReason=NULL, recoveredAt=NOW(), recoveredBy=? WHERE id=?")->execute([$user['id'], $id]);
    jsonResponse(['message' => 'Cotización recuperada']);
}

// ====== WonQuotes (Servicios Generales) ======

// GET /api/quotes/won
if ($method === 'GET' && $sub === 'won') {
    $rows = $pdo->query("
        SELECT wq.*, q.id as q_id, q.folio, q.description, q.amount, q.currency, q.commitmentDate, q.status as q_status,
               r.id as rec_id, r.name as rec_name,
               c.id as cmp_id, c.name as cmp_name,
               z.id as zon_id, z.name as zon_name,
               u1.name as winner_name, u2.name as sender_name
        FROM WonQuotes wq
        JOIN Quotes q ON wq.quoteId = q.id AND q.status = 'Ganado'
        LEFT JOIN Recipients r ON q.recipientId = r.id
        LEFT JOIN Companies c ON r.companyId = c.id
        LEFT JOIN Zones z ON r.zoneId = z.id
        LEFT JOIN Users u1 ON wq.wonBy = u1.id
        LEFT JOIN Users u2 ON q.sentBy = u2.id
        ORDER BY wq.wonAt DESC
    ")->fetchAll();

    foreach ($rows as &$row) {
        $row['quote'] = ['id' => $row['q_id'], 'folio' => $row['folio'], 'description' => $row['description'], 'amount' => $row['amount'], 'currency' => $row['currency'], 'commitmentDate' => $row['commitmentDate'], 'status' => $row['q_status'],
            'recipient' => $row['rec_id'] ? ['id' => $row['rec_id'], 'name' => $row['rec_name'], 'company' => $row['cmp_id'] ? ['id' => $row['cmp_id'], 'name' => $row['cmp_name']] : null, 'zone' => $row['zon_id'] ? ['id' => $row['zon_id'], 'name' => $row['zon_name']] : null] : null,
            'sender' => $row['sender_name'] ? ['name' => $row['sender_name']] : null,
        ];
        $row['winner'] = ['name' => $row['winner_name']];

        $pkgs = $pdo->prepare("SELECT p.* FROM Packages p JOIN WonQuotePackages wqp ON p.id = wqp.packageId WHERE wqp.wonQuoteId = ?");
        $pkgs->execute([$row['id']]);
        $row['linkedPackages'] = $pkgs->fetchAll();

        $oes = $pdo->prepare("SELECT * FROM OperationalExpenses WHERE wonQuoteId = ? ORDER BY date DESC");
        $oes->execute([$row['id']]);
        $row['operationalExpenses'] = $oes->fetchAll();

        foreach (['q_id','folio','description','amount','currency','commitmentDate','q_status','rec_id','rec_name','cmp_id','cmp_name','zon_id','zon_name','winner_name','sender_name'] as $k) unset($row[$k]);
    }
    jsonResponse($rows);
}

// PUT /api/quotes/wonquote/:id — Actualizar WonQuote
if ($method === 'PUT' && $sub === 'wonquote' && is_numeric($subId)) {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $wqId = (int)$subId;
    $allowed = ['category','purchaseOrder','internalPurchasesProgress','commercialCloseProgress','technicalCloseProgress','executionProgress'];
    $sets = []; $vals = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            if (str_ends_with($f, 'Progress')) {
                $v = (int)$body[$f];
                if ($v < 0 || $v > 100) jsonResponse(['message' => "El campo $f debe estar entre 0 y 100"], 400);
            }
            $sets[] = "$f = ?"; $vals[] = $body[$f];
        }
    }
    if ($sets) { $vals[] = $wqId; $pdo->prepare("UPDATE WonQuotes SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals); }
    jsonResponse(['message' => 'Actualizado']);
}

// POST /api/quotes/won/:wonQuoteId/link — Vincular paquete
if ($method === 'POST' && $sub === 'won' && is_numeric($subId) && ($parts[4] ?? '') === 'link') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $packageId = $body['packageId'] ?? null;
    $exists = $pdo->prepare("SELECT 1 FROM WonQuotePackages WHERE wonQuoteId = ? AND packageId = ?");
    $exists->execute([$subId, $packageId]);
    if ($exists->fetchColumn()) jsonResponse(['message' => 'Ya está vinculada'], 400);
    $pdo->prepare("INSERT INTO WonQuotePackages (wonQuoteId, packageId) VALUES (?,?)")->execute([$subId, $packageId]);
    jsonResponse(['message' => 'Compra vinculada exitosamente']);
}

// DELETE /api/quotes/won/:wonQuoteId/link/:packageId — Desvincular
if ($method === 'DELETE' && $sub === 'won' && is_numeric($subId)) {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $packageId = $parts[5] ?? null;
    $pdo->prepare("DELETE FROM WonQuotePackages WHERE wonQuoteId = ? AND packageId = ?")->execute([$subId, $packageId]);
    jsonResponse(['message' => 'Desvinculado']);
}

// POST /api/quotes/close/:wonQuoteId — Cerrar proyecto
if ($method === 'POST' && $sub === 'close' && is_numeric($subId)) {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $wq = $pdo->prepare("SELECT quoteId FROM WonQuotes WHERE id = ?"); $wq->execute([$subId]); $row = $wq->fetch();
    if (!$row) jsonResponse(['message' => 'Proyecto no encontrado'], 404);
    $pdo->prepare("UPDATE Quotes SET status='Cerrado' WHERE id=?")->execute([$row['quoteId']]);
    jsonResponse(['message' => 'Cotización cerrada y enviada al histórico']);
}

// GET /api/quotes/opex — Gastos operativos
if ($method === 'GET' && $sub === 'opex') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $rows = $pdo->query("
        SELECT oe.*, wq.id as wq_id, q.folio, q.description
        FROM OperationalExpenses oe
        JOIN WonQuotes wq ON oe.wonQuoteId = wq.id
        JOIN Quotes q ON wq.quoteId = q.id
        ORDER BY oe.date DESC
    ")->fetchAll();
    foreach ($rows as &$r) {
        $r['wonQuote'] = ['id' => $r['wq_id'], 'quote' => ['folio' => $r['folio'], 'description' => $r['description']]];
        unset($r['wq_id'], $r['folio'], $r['description']);
    }
    jsonResponse($rows);
}

// POST /api/quotes/opex — Agregar gasto operativo
if ($method === 'POST' && $sub === 'opex') {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $pdo->prepare("INSERT INTO OperationalExpenses (wonQuoteId, description, amount, date) VALUES (?,?,?,?)")
        ->execute([$body['wonQuoteId'], $body['description'], $body['amount'], $body['date'] ?? date('Y-m-d')]);
    jsonResponse(['id' => $pdo->lastInsertId(), ...$body], 201);
}

// DELETE /api/quotes/opex/:id
if ($method === 'DELETE' && $sub === 'opex' && is_numeric($subId)) {
    if ($user['role'] !== 'Admin') jsonResponse(['message' => 'Solo administradores'], 403);
    $pdo->prepare("DELETE FROM OperationalExpenses WHERE id = ?")->execute([(int)$subId]);
    jsonResponse(['message' => 'Gasto eliminado']);
}

jsonResponse(['message' => 'Ruta no encontrada'], 404);
