<?php
include 'backend/config.php';

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die("Falha na ligação: " . $conn->connect_error);
}

echo "A atualizar base de dados para o sistema de Tickets...\n";

// 1. Atualizar Clientes (leads) com campos de Banco de Horas (Verificação Manual)
$columns = ["banco_horas_contratado" => "DECIMAL(10,2) DEFAULT 0.00", 
            "banco_horas_restantes" => "DECIMAL(10,2) DEFAULT 0.00", 
            "is_ilimitado" => "TINYINT(1) DEFAULT 0"];

foreach ($columns as $col => $type) {
    $check = $conn->query("SHOW COLUMNS FROM leads LIKE '$col'");
    if ($check->num_rows == 0) {
        $queries[] = "ALTER TABLE leads ADD $col $type";
    }
}

// 2. Criar Tabela de Tickets (Cabeçalho)
$queries[] = "CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT NOT NULL,
    assunto VARCHAR(255) NOT NULL,
    status ENUM('Aberto', 'Em Pausa', 'Resolvido', 'Fechado') DEFAULT 'Aberto',
    prioridade ENUM('Baixa', 'Média', 'Alta', 'Crítica') DEFAULT 'Média',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fecho TIMESTAMP NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

// 3. Criar Tabela de Intervenções (Tarefas/Contabilização de tempo)
$queries[] = "CREATE TABLE IF NOT EXISTS ticket_intervencoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    descricao TEXT NOT NULL,
    minutos_gastos INT DEFAULT 0,
    data_intervencao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

foreach ($queries as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "Sucesso: " . substr($sql, 0, 50) . "...\n";
    } else {
        echo "Erro ao executar: " . $conn->error . "\n";
    }
}

$conn->close();
echo "Base de Dados pronta para Tickets e Banco de Horas.\n";
?>
