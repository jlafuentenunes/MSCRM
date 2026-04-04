<?php
/**
 * Script de Migração: Gestão de Tipos de Serviço - MsCRM
 * Cria as tabelas para suportar a categorização de serviços.
 */

require_once 'backend/config.php';

try {
    $pdo = getDatabaseConnection();

    // 1. Criar Tabela de Tipos de Serviço
    $sql = "CREATE TABLE IF NOT EXISTS tipos_servico (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        icone VARCHAR(50) DEFAULT 'Terminal',
        cor VARCHAR(7) DEFAULT '#3b82f6',
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $pdo->exec($sql);

    // 2. Adicionar relação na tabela de Leads (se ainda não existir)
    try {
        $pdo->exec("ALTER TABLE leads ADD COLUMN tipo_servico_id INT DEFAULT NULL AFTER is_ilimitado;");
        $pdo->exec("ALTER TABLE leads ADD FOREIGN KEY (tipo_servico_id) REFERENCES tipos_servico(id) ON DELETE SET NULL;");
    } catch (PDOException $e) {
        // Ignorar se a coluna já existir
    }

    // 3. Inserir alguns dados iniciais úteis
    $check = $pdo->query("SELECT count(*) FROM tipos_servico")->fetchColumn();
    if ($check == 0) {
        $stmt = $pdo->prepare("INSERT INTO tipos_servico (nome, icone, cor) VALUES (?, ?, ?)");
        $stmt->execute(['Desenvolvimento Web', 'Layout', '#3b82f6']);
        $stmt->execute(['Marketing Digital', 'TrendingUp', '#ec4899']);
        $stmt->execute(['Consultoria TI', 'Shield', '#10b981']);
        $stmt->execute(['Manutenção', 'Settings', '#f59e0b']);
    }

    echo "Sucesso: Tabelas de Tipos de Serviço criadas e populadas!\n";

} catch (PDOException $e) {
    die("Erro ao configurar serviços: " . $e->getMessage() . "\n");
}
