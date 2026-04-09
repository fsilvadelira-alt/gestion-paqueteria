<?php
requireAuth();
$pdo = getDB();

// GET /api/dashboard/stats
if ($method === 'GET' && $sub === 'stats') {
    $year  = date('Y');
    $month = date('m');
    $firstDay = "$year-$month-01";
    $lastDay  = date('Y-m-d', strtotime('first day of next month'));

    $q = fn(string $sql, array $p = []) => (function() use ($pdo, $sql, $p) {
        $s = $pdo->prepare($sql); $s->execute($p); return $s->fetchColumn() ?? 0;
    })();

    $totalEnCamino    = $q("SELECT COUNT(*) FROM Packages WHERE status = 'En camino'");
    $totalRecibidos   = $q("SELECT COUNT(*) FROM Packages WHERE status = 'Recibido'");
    $totalEntregados  = $q("SELECT COUNT(*) FROM Packages WHERE status = 'Entregado'");
    $totalParaRegresar= $q("SELECT COUNT(*) FROM Packages WHERE status IN ('Incorrecto','Defectuoso')");

    $gMensualesAmt    = $q("SELECT IFNULL(SUM(amountMXN),0) FROM Packages WHERE registrationDate >= ? AND registrationDate < ?", [$firstDay, $lastDay]);
    $gMensualesShip   = $q("SELECT IFNULL(SUM(shippingCost),0) FROM Packages WHERE registrationDate >= ? AND registrationDate < ?", [$firstDay, $lastDay]);
    $gMensualesCaja   = $q("SELECT IFNULL(SUM(amount),0) FROM Expenses WHERE type='gasto' AND date >= ? AND date < ?", [$firstDay, $lastDay]);
    $gastosMensuales  = $gMensualesAmt + $gMensualesShip + $gMensualesCaja;

    $gTotalesCaja     = $q("SELECT IFNULL(SUM(amount),0) FROM Expenses WHERE type='gasto'");
    $iTotalesCaja     = $q("SELECT IFNULL(SUM(amount),0) FROM Expenses WHERE type='ingreso'");
    $saldoCajaChica   = $iTotalesCaja - $gTotalesCaja;

    $gastosTotales    = $q("SELECT IFNULL(SUM(amountMXN),0) FROM Packages") + $q("SELECT IFNULL(SUM(shippingCost),0) FROM Packages") + $gTotalesCaja;

    $gFactCaja        = $q("SELECT IFNULL(SUM(amount),0) FROM Expenses WHERE type='gasto' AND isFacturado=1");
    $gastosFacturados = $q("SELECT IFNULL(SUM(amountMXN),0) FROM Packages WHERE isBilled=1") + $q("SELECT IFNULL(SUM(shippingCost),0) FROM Packages WHERE shippingIsBilled=1") + $gFactCaja;
    $gastosNoFact     = $q("SELECT IFNULL(SUM(amountMXN),0) FROM Packages WHERE isBilled=0") + $q("SELECT IFNULL(SUM(shippingCost),0) FROM Packages WHERE shippingIsBilled=0") + $q("SELECT IFNULL(SUM(amount),0) FROM Expenses WHERE type='gasto' AND isFacturado=0");

    jsonResponse([
        'totalEnCamino'     => (int)$totalEnCamino,
        'totalRecibidos'    => (int)$totalRecibidos,
        'totalEntregados'   => (int)$totalEntregados,
        'totalParaRegresar' => (int)$totalParaRegresar,
        'gastosMensuales'   => (float)$gastosMensuales,
        'gastosTotales'     => (float)$gastosTotales,
        'gastosFacturados'  => (float)$gastosFacturados,
        'gastosNoFacturados'=> (float)$gastosNoFact,
        'saldoCajaChica'    => (float)$saldoCajaChica,
    ]);
}

// GET /api/dashboard/charts
if ($method === 'GET' && $sub === 'charts') {
    $year = date('Y');

    $expensesByCarrier = $pdo->query("
        SELECT p.carrierId, c.name as carrier_name, SUM(p.amountMXN) as totalCost
        FROM Packages p LEFT JOIN Carriers c ON p.carrierId = c.id
        GROUP BY p.carrierId, c.name
    ")->fetchAll();
    $expensesByCarrier = array_map(fn($r) => ['carrierId' => $r['carrierId'], 'totalCost' => $r['totalCost'], 'carrier' => ['name' => $r['carrier_name']]], $expensesByCarrier);

    $packagesByCarrier = $pdo->query("
        SELECT p.carrierId, c.name as carrier_name, COUNT(p.id) as totalPackages
        FROM Packages p LEFT JOIN Carriers c ON p.carrierId = c.id
        WHERE p.purchaseType != 'Gasto de Paquetería' OR p.purchaseType IS NULL
        GROUP BY p.carrierId, c.name
    ")->fetchAll();
    $packagesByCarrier = array_map(fn($r) => ['carrierId' => $r['carrierId'], 'totalPackages' => $r['totalPackages'], 'carrier' => ['name' => $r['carrier_name']]], $packagesByCarrier);

    $packagesByStatus = $pdo->query("SELECT status, COUNT(id) as totalPackages FROM Packages GROUP BY status")->fetchAll();

    $packagesByLogistics = $pdo->query("
        SELECT p.logisticsCompanyId, l.name as logistics_name, COUNT(p.id) as totalPackages
        FROM Packages p LEFT JOIN Logistics l ON p.logisticsCompanyId = l.id
        WHERE p.logisticsCompanyId IS NOT NULL
        GROUP BY p.logisticsCompanyId, l.name
    ")->fetchAll();
    $packagesByLogistics = array_map(fn($r) => ['logisticsCompanyId' => $r['logisticsCompanyId'], 'totalPackages' => $r['totalPackages'], 'logisticsCompany' => ['name' => $r['logistics_name']]], $packagesByLogistics);

    $monthlyTrend = $pdo->prepare("
        SELECT month, SUM(totalCost) as totalCost FROM (
            SELECT SUBSTRING(registrationDate, 6, 2) as month, (amountMXN + IFNULL(shippingCost,0)) as totalCost
            FROM Packages WHERE SUBSTRING(registrationDate, 1, 4) = ?
            UNION ALL
            SELECT SUBSTRING(date, 6, 2) as month, amount as totalCost
            FROM Expenses WHERE SUBSTRING(date, 1, 4) = ? AND type = 'gasto'
        ) AS combined GROUP BY month ORDER BY month ASC
    ");
    $monthlyTrend->execute([$year, $year]);

    jsonResponse([
        'expensesByCarrier'   => $expensesByCarrier,
        'packagesByCarrier'   => $packagesByCarrier,
        'packagesByStatus'    => $packagesByStatus,
        'packagesByLogistics' => $packagesByLogistics,
        'monthlyTrend'        => $monthlyTrend->fetchAll(),
    ]);
}

jsonResponse(['message' => 'Ruta no encontrada'], 404);
