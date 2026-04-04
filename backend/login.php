<?php
/**
 * Sistema de Login do CRM - Monitor de Surpresas
 * Processa a verificação de utilizador e inicia sessão
 */

session_set_cookie_params(['samesite' => 'None', 'secure' => true]);
session_start();
require_once 'config.php';

// Segurança de Headers para React (CORS)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? '*')); 
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user = $data['username'] ?? '';
    $pass = $data['password'] ?? '';

    if (empty($user) || empty($pass)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Utilizador e password obrigatórios."]);
        exit;
    }

    try {
        $conn = getDatabaseConnection();
        $stmt = $conn->prepare("SELECT id, username, password, nome_completo, role FROM users WHERE username = ?");
        $stmt->execute([$user]);
        $userData = $stmt->fetch();

        if ($userData && password_verify($pass, $userData['password'])) {
            // Login bem-sucedido
            $_SESSION['user_id'] = $userData['id'];
            $_SESSION['role'] = $userData['role'];
            $_SESSION['nome'] = $userData['nome_completo'];

            echo json_encode([
                "status" => "success",
                "message" => "Login efetuado com sucesso!",
                "user" => [
                    "id" => $userData['id'],
                    "username" => $userData['username'],
                    "nome" => $userData['nome_completo'],
                    "role" => $userData['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Credenciais inválidas."]);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Erro no servidor."]);
    }
}
