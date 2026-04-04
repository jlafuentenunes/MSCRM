<?php
/**
 * Configuração de Ligação à Base de Dados (PDO)
 * Monitor de Surpresas - CRM Backend (Local DBngin)
 */

// Configurações Flexíveis (Mac Local vs Servidor Online)
define('DB_HOST', getenv('DB_HOST') ?: '127.0.0.1'); 
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'monitor_surpresas_crm');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: ''); 
define('DB_CHARSET', 'utf8mb4');

function getDatabaseConnection() {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, DB_USER, DB_PASS, $options);
    } catch (PDOException $e) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Erro na ligação local: " . $e->getMessage()
        ]);
        exit;
    }
}
