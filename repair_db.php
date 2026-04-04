<?php
require_once 'backend/config.php';

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $conn = new PDO($dsn, DB_USER, DB_PASS);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Reparando estrutura MS360 (Modo Compatibilidade MySQL)...\n";

    $requiredColumns = [
        'telemovel' => "VARCHAR(20)",
        'servico' => "VARCHAR(100)",
        'tamanho_equipa' => "INT DEFAULT 1",
        'resumo' => "TEXT",
        'status' => "VARCHAR(50) DEFAULT 'Novo'"
    ];

    foreach ($requiredColumns as $colName => $colDef) {
        $check = $conn->query("SHOW COLUMNS FROM leads LIKE '$colName'")->fetch();
        if (!$check) {
            $conn->exec("ALTER TABLE leads ADD COLUMN $colName $colDef");
            echo "Adicionada: $colName\n";
        } else {
            echo "Já existe: $colName\n";
        }
    }

    echo "\nMS360 Reparação Concluída com Sucesso!";

} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
