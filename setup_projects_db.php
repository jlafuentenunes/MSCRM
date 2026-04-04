<?php
require_once 'backend/config.php';

$conn = getDatabaseConnection();

echo "A configurar Módulo de Projetos e Tarefas...\n";

try {
    // 1. Tabela de Projetos
    $sqlProjects = "CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        lead_id INT NOT NULL,
        tipo_servico_id INT DEFAULT NULL,
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        status ENUM('Planeamento', 'Ativo', 'Pausado', 'Concluído', 'Cancelado') DEFAULT 'Planeamento',
        data_inicio DATE DEFAULT NULL,
        data_fim_prevista DATE DEFAULT NULL,
        progresso INT DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (tipo_servico_id) REFERENCES tipos_servico(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $conn->exec($sqlProjects);
    echo "Sucesso: Tabela 'projects' configurada. ✅\n";

    // 2. Tabela de Tarefas
    $sqlTasks = "CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        prioridade ENUM('Baixa', 'Média', 'Alta', 'Crítica') DEFAULT 'Média',
        status ENUM('Pendente', 'Em Progresso', 'Revisão', 'Concluído') DEFAULT 'Pendente',
        horas_estimadas DECIMAL(10,2) DEFAULT 0,
        horas_gastas DECIMAL(10,2) DEFAULT 0,
        data_limite DATE DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $conn->exec($sqlTasks);
    echo "Sucesso: Tabela 'tasks' configurada. ✅\n";

    echo "Base de Dados pronta para Gestão de Projetos! 🚀🛸\n";

} catch (PDOException $e) {
    die("Erro na BD: " . $e->getMessage() . "\n");
}
?>
