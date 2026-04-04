<?php
/**
 * Script de Migração: Automações Flexíveis - MsCRM
 * Cria as tabelas necessárias para o motor de automação (Rule Engine)
 */

require_once 'backend/config.php';

try {
    $pdo = getDatabaseConnection();

    // 1. Criar Tabela de Automações
    $sql = "CREATE TABLE IF NOT EXISTS automacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL DEFAULT 1,
        nome VARCHAR(255) NOT NULL,
        gatilho ENUM('horario', 'email_recebido', 'saldo_critico', 'fatura_vencida') NOT NULL,
        gatilho_config JSON DEFAULT NULL,
        condicao JSON DEFAULT NULL,
        acao ENUM('enviar_resumo', 'notificacao_push', 'mudar_status_lead', 'sync_mail') NOT NULL,
        acao_config JSON DEFAULT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_run DATETIME DEFAULT NULL,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);
    
    // 2. Tabela de Logs de Automação (para saber o que correu e quando)
    $sqlLogs = "CREATE TABLE IF NOT EXISTS automacoes_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        automacao_id INT NOT NULL,
        status ENUM('sucesso', 'erro') NOT NULL,
        resultado TEXT,
        data_execucao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (automacao_id) REFERENCES automacoes(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sqlLogs);

    echo "Sucesso: Tabelas de Automação criadas com sucesso!\n";

} catch (PDOException $e) {
    die("Erro ao criar tabelas: " . $e->getMessage() . "\n");
}
