<?php
/**
 * Script Principal de Configuração e Migração da Base de Dados - MsCRM
 * Executa todas as migrações necessárias para colocar a base de dados mscrm pronta a funcionar.
 */

require_once 'backend/config.php';

echo "🛸 A iniciar a configuração completa da base de dados MsCRM...\n";

try {
    $pdo = getDatabaseConnection();
    
    // 1. Criar Tabela de Utilizadores (users)
    echo "Creating table 'users'...\n";
    $sqlUsers = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        nome_completo VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sqlUsers);
    echo "✅ Tabela 'users' criada ou já existente.\n";

    // 2. Criar Tabela Base de Leads (leads)
    echo "Creating base table 'leads'...\n";
    $sqlLeads = "CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        empresa VARCHAR(255) DEFAULT '',
        email VARCHAR(255) NOT NULL,
        data_registo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sqlLeads);
    echo "✅ Tabela base 'leads' criada ou já existente.\n";

    // 3. Executar Scripts de Módulos Individuais
    echo "\n📦 A executar migrações dos módulos...\n";

    // 3.1. Módulo de Serviços
    echo "\n--- Módulo de Serviços ---\n";
    require 'setup_services_db.php';

    // 3.2. Módulo de Tickets (Usa mysqli, por isso executamos isoladamente)
    echo "\n--- Módulo de Tickets ---\n";
    require 'setup_tickets_db.php';

    // 3.3. Módulo de Projetos
    echo "\n--- Módulo de Projetos ---\n";
    require 'setup_projects_db.php';

    // 3.4. Módulo de Webmail
    echo "\n--- Módulo de Webmail ---\n";
    require 'setup_mail_db.php';

    // 3.5. Módulo de Automações
    echo "\n--- Módulo de Automações ---\n";
    require 'setup_automations_db.php';

    // Re-conectar com PDO para o resto das criações personalizadas
    $pdo = getDatabaseConnection();

    // 4. Criar Tabela de Alarmes de Faturação (billing_alerts)
    echo "\n--- Tabelas Auxiliares ---\n";
    echo "Creating table 'billing_alerts'...\n";
    $sqlBilling = "CREATE TABLE IF NOT EXISTS billing_alerts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        periodicidade VARCHAR(50) DEFAULT 'Mensal',
        regra_recorrencia VARCHAR(255) DEFAULT NULL,
        proxima_fatura DATE NOT NULL,
        status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
        descricao TEXT DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sqlBilling);
    echo "✅ Tabela 'billing_alerts' criada ou já existente.\n";

    // 5. Criar Tabela de Notificações (notificacoes)
    echo "Creating table 'notificacoes'...\n";
    $sqlNotif = "CREATE TABLE IF NOT EXISTS notificacoes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(50) DEFAULT 'aviso',
        titulo VARCHAR(255) NOT NULL,
        mensagem TEXT NOT NULL,
        lead_id INT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sqlNotif);
    echo "✅ Tabela 'notificacoes' criada ou já existente.\n";

    // 6. Criar Tabela de Lembretes de Pagamento (lembretes_pagamento)
    echo "Creating table 'lembretes_pagamento'...\n";
    $sqlReminders = "CREATE TABLE IF NOT EXISTS lembretes_pagamento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        assunto VARCHAR(255) NOT NULL,
        valor DECIMAL(10,2) NOT NULL,
        tipo_recorrencia VARCHAR(50) DEFAULT 'mensal',
        regra_recorrencia VARCHAR(255) DEFAULT NULL,
        data_inicio DATE NOT NULL,
        data_fim DATE DEFAULT NULL,
        proxima_data DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'ativo',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    $pdo->exec($sqlReminders);
    echo "✅ Tabela 'lembretes_pagamento' criada ou já existente.\n";

    // 7. Reparar a Base de Dados (garantir consistência e colunas extra)
    echo "\n🔧 A executar a reparação e validação da estrutura...\n";
    require 'repair_db.php';

    // 8. Criar Utilizador de Teste
    echo "\n👤 A criar o utilizador administrador de teste...\n";
    require 'create_test_user.php';

    echo "\n🚀 Configuração Concluída com Sucesso! A base de dados MsCRM está pronta.\n";

} catch (Exception $e) {
    echo "\n❌ Erro durante a configuração: " . $e->getMessage() . "\n";
    exit(1);
}
