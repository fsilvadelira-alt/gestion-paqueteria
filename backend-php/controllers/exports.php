<?php
requireAdmin();
$pdo = getDB();

// GET /api/exports/packages — exportar CSV de paquetes
if ($method === 'GET' && $sub === 'packages') {
    $rows = $pdo->query("
        SELECT p.trackingNumber, p.description, p.status, p.purchaseType,
               p.amountMXN, p.shippingCost, p.registrationDate,
               c.name as carrier, r.name as recipient
        FROM Packages p
        LEFT JOIN Carriers c ON p.carrierId = c.id
        LEFT JOIN Recipients r ON p.recipientId = r.id
        ORDER BY p.createdAt DESC
    ")->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="paquetes.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['No. Guía','Descripción','Estado','Tipo','Monto MXN','Envío','Fecha Registro','Paquetería','Destinatario']);
    foreach ($rows as $r) fputcsv($out, array_values($r));
    fclose($out);
    exit;
}

// GET /api/exports/expenses — exportar CSV de gastos
if ($method === 'GET' && $sub === 'expenses') {
    $rows = $pdo->query("SELECT description, amount, type, date, isFacturado, invoiceNumber FROM Expenses ORDER BY date DESC")->fetchAll();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="gastos.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['Descripción','Monto','Tipo','Fecha','Facturado','No. Factura']);
    foreach ($rows as $r) fputcsv($out, array_values($r));
    fclose($out);
    exit;
}

jsonResponse(['message' => 'Tipo de exportación no soportado'], 400);
