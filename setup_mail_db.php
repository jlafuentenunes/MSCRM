<?php
/**
 * Setup da Base de Dados para o Sistema de Webmail
 * Criação da tabela de configurações de email.
 */
include 'backend/config.php';

try {
    $pdo = getDatabaseConnection();
    
    echo "A criar tabela de configurações de email...\n";

    $sql = "CREATE TABLE IF NOT EXISTS mail_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        imap_host VARCHAR(255) NOT NULL,
        imap_port INT DEFAULT 993,
        imap_user VARCHAR(255) NOT NULL,
        imap_pass TEXT NOT NULL, 
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INT DEFAULT 465,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_pass TEXT NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_synced_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    $pdo->exec($sql);
    echo "Sucesso: Tabela 'mail_settings' criada ou já existente.\n";

    // Criar também uma tabela para cache de emails (opcional mas recomendado para performance)
    $sqlCache = "CREATE TABLE IF NOT EXISTS mail_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message_id VARCHAR(255) UNIQUE,
        subject VARCHAR(255),
        from_email VARCHAR(255),
        to_email VARCHAR(255),
        body TEXT,
        date_sent DATETIME,
        is_read TINYINT(1) DEFAULT 0,
        folder VARCHAR(50) DEFAULT 'INBOX',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

    $pdo->exec($sqlCache);
    echo "Sucesso: Tabela 'mail_cache' criada ou já existente.\n";

} catch (Exception $e) {
    die("Erro ao configurar DB de email: " . $e->getMessage() . "\n");
}
?>
