<?php
require_once 'backend/config.php';
try {
    $conn = getDatabaseConnection();
    $user = 'test_admin';
    $pass = password_hash('test_pass', PASSWORD_DEFAULT);
    $nome = 'Administrador de Teste';
    
    // Remover se já existir
    $stmt = $conn->prepare("DELETE FROM users WHERE username = ?");
    $stmt->execute([$user]);
    
    $stmt = $conn->prepare("INSERT INTO users (username, password, nome_completo, role) VALUES (?, ?, ?, 'admin')");
    $stmt->execute([$user, $pass, $nome]);
    echo "Utilizador de teste criado com sucesso: test_admin / test_pass\n";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
