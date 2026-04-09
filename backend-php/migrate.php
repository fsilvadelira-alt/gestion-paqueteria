<?php
// ============================================================
// Script de creación de tablas MySQL (ejecutar una sola vez)
// Accede a: https://rp.icautomatizacion.com/api/migrate.php
// IMPORTANTE: Eliminar este archivo del servidor tras ejecutarlo
// ============================================================
require_once __DIR__ . '/db.php';

$pdo = getDB();
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

$tables = [
    "Users" => "
        CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('Admin','User') NOT NULL DEFAULT 'User',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Carriers" => "
        CREATE TABLE IF NOT EXISTS Carriers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Logistics" => "
        CREATE TABLE IF NOT EXISTS Logistics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Companies" => "
        CREATE TABLE IF NOT EXISTS Companies (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Zones" => "
        CREATE TABLE IF NOT EXISTS Zones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            companyId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (companyId) REFERENCES Companies(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Recipients" => "
        CREATE TABLE IF NOT EXISTS Recipients (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            department VARCHAR(255),
            companyId INT,
            zoneId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (companyId) REFERENCES Companies(id) ON DELETE SET NULL,
            FOREIGN KEY (zoneId) REFERENCES Zones(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Packages" => "
        CREATE TABLE IF NOT EXISTS Packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            trackingNumber VARCHAR(255),
            description TEXT,
            status ENUM('En camino','Recibido','Listo para entregar','Entregado','Incorrecto','Defectuoso') DEFAULT 'En camino',
            purchaseType VARCHAR(255),
            amountMXN DECIMAL(12,2) DEFAULT 0,
            amountUSD DECIMAL(12,2) DEFAULT 0,
            isBilled TINYINT(1) DEFAULT 0,
            invoiceNumber VARCHAR(255),
            shippingCost DECIMAL(12,2) DEFAULT 0,
            shippingIsBilled TINYINT(1) DEFAULT 0,
            shippingInvoiceNumber VARCHAR(255),
            shippingCostAssigned TINYINT(1) DEFAULT 0,
            shippingAssignedAt DATETIME,
            shippingAdminId INT,
            registrationDate DATE,
            receptionDate DATETIME,
            deliveryDate DATETIME,
            notes TEXT,
            carrierId INT,
            logisticsCompanyId INT,
            recipientId INT,
            receivedBy INT,
            deliveredBy INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (carrierId) REFERENCES Carriers(id) ON DELETE SET NULL,
            FOREIGN KEY (logisticsCompanyId) REFERENCES Logistics(id) ON DELETE SET NULL,
            FOREIGN KEY (recipientId) REFERENCES Recipients(id) ON DELETE SET NULL,
            FOREIGN KEY (receivedBy) REFERENCES Users(id) ON DELETE SET NULL,
            FOREIGN KEY (deliveredBy) REFERENCES Users(id) ON DELETE SET NULL,
            FOREIGN KEY (shippingAdminId) REFERENCES Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Expenses" => "
        CREATE TABLE IF NOT EXISTS Expenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            type ENUM('ingreso','gasto') NOT NULL,
            date DATE NOT NULL,
            isFacturado TINYINT(1) DEFAULT 0,
            invoiceNumber VARCHAR(255),
            notes TEXT,
            userId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "Quotes" => "
        CREATE TABLE IF NOT EXISTS Quotes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            folio VARCHAR(255),
            description TEXT,
            status ENUM('Borrador','Enviado','Ganado','Perdido','Cerrado') DEFAULT 'Borrador',
            amount DECIMAL(12,2),
            currency VARCHAR(10) DEFAULT 'MXN',
            commitmentDate DATE,
            sentAt DATETIME,
            sentBy INT,
            lostAt DATETIME,
            lostReason TEXT,
            recoveredAt DATETIME,
            recoveredBy INT,
            internalNotes TEXT,
            recipientId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (sentBy) REFERENCES Users(id) ON DELETE SET NULL,
            FOREIGN KEY (recoveredBy) REFERENCES Users(id) ON DELETE SET NULL,
            FOREIGN KEY (recipientId) REFERENCES Recipients(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "WonQuotes" => "
        CREATE TABLE IF NOT EXISTS WonQuotes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            quoteId INT UNIQUE,
            category VARCHAR(255),
            purchaseOrder VARCHAR(255),
            wonAt DATETIME,
            wonBy INT,
            internalPurchasesProgress INT DEFAULT 0,
            commercialCloseProgress INT DEFAULT 0,
            technicalCloseProgress INT DEFAULT 0,
            executionProgress INT DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (quoteId) REFERENCES Quotes(id) ON DELETE CASCADE,
            FOREIGN KEY (wonBy) REFERENCES Users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "WonQuotePackages" => "
        CREATE TABLE IF NOT EXISTS WonQuotePackages (
            wonQuoteId INT NOT NULL,
            packageId INT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (wonQuoteId, packageId),
            FOREIGN KEY (wonQuoteId) REFERENCES WonQuotes(id) ON DELETE CASCADE,
            FOREIGN KEY (packageId) REFERENCES Packages(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
    "OperationalExpenses" => "
        CREATE TABLE IF NOT EXISTS OperationalExpenses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            wonQuoteId INT NOT NULL,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            date DATE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (wonQuoteId) REFERENCES WonQuotes(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ",
];

$results = [];
foreach ($tables as $tableName => $sql) {
    try {
        $pdo->exec($sql);
        $results[] = "✅ Tabla '$tableName' creada/verificada.";
    } catch (Exception $e) {
        $results[] = "❌ Error en tabla '$tableName': " . $e->getMessage();
    }
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Crear usuario Admin por defecto
try {
    $exists = $pdo->query("SELECT id FROM Users WHERE email = 'admin@packflow.com'")->fetchColumn();
    if (!$exists) {
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        $pdo->prepare("INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, 'Admin')")
            ->execute(['Administrador', 'admin@packflow.com', $hash]);
        $results[] = "✅ Usuario Admin creado: admin@packflow.com / admin123";
    } else {
        $results[] = "ℹ️ Usuario Admin ya existe.";
    }
} catch (Exception $e) {
    $results[] = "❌ Error al crear Admin: " . $e->getMessage();
}

header('Content-Type: text/html; charset=utf-8');
echo '<h2>📦 PackFlow — Migración de Base de Datos</h2>';
echo '<pre>' . implode("\n", $results) . '</pre>';
echo '<hr><p>⚠️ <strong>ELIMINA este archivo (migrate.php) del servidor ahora que ya lo ejecutaste.</strong></p>';
