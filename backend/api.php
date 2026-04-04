<?php
/**
 * API RESTful Completa do CRM
 * Monitor de Surpresas
 */

session_set_cookie_params(['samesite' => 'None', 'secure' => true]);
session_start();
require_once 'config.php';

// Segurança de Headers para permitir Sessão (withCredentials)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Proteção de Sessão
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Sessão expirada."]);
    exit;
}

$conn = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Se passar um ID, retorna uma lead específica
            if (isset($_GET['id'])) {
                $stmt = $conn->prepare("SELECT l.*, s.nome as servico_nome, s.icone as servico_icone, s.cor as servico_cor 
                                      FROM leads l 
                                      LEFT JOIN tipos_servico s ON l.tipo_servico_id = s.id 
                                      WHERE l.id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode($stmt->fetch());
            } else {
                // Listar todas as leads ordenadas por data descendente
                $stmt = $conn->prepare("SELECT l.*, s.nome as servico_nome, s.icone as servico_icone, s.cor as servico_cor 
                                      FROM leads l 
                                      LEFT JOIN tipos_servico s ON l.tipo_servico_id = s.id 
                                      ORDER BY l.data_registo DESC");
                $stmt->execute();
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['nome']) || empty($data['email'])) {
                throw new Exception("Nome e Email são obrigatórios.");
            }
            
            $sql = "INSERT INTO leads (nome, empresa, email, telemovel, servico, tipo_servico_id, tamanho_equipa, resumo, status, tipo, banco_horas_contratado, banco_horas_restantes, is_ilimitado) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $contracted = $data['banco_horas_contratado'] ?? 0;
            $stmt->execute([
                $data['nome'],
                $data['empresa'] ?? '',
                $data['email'],
                $data['telemovel'] ?? '',
                $data['servico'] ?? '',
                $data['tipo_servico_id'] ?? null,
                $data['tamanho_equipa'] ?? 0,
                $data['resumo'] ?? '',
                $data['status'] ?? 'Novo',
                $data['tipo'] ?? 'avenca',
                $contracted,
                $contracted,
                $data['is_ilimitado'] ?? 0
            ]);
            
            echo json_encode(["status" => "success", "message" => "Lead criada com sucesso", "id" => $conn->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id'])) throw new Exception("ID da lead não fornecido.");

            $sql = "UPDATE leads SET nome=?, empresa=?, email=?, telemovel=?, servico=?, tipo_servico_id=?, tamanho_equipa=?, resumo=?, status=?, tipo=?, banco_horas_contratado=?, is_ilimitado=? WHERE id=?";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $data['nome'],
                $data['empresa'],
                $data['email'],
                $data['telemovel'],
                $data['servico'],
                $data['tipo_servico_id'] ?? null,
                $data['tamanho_equipa'],
                $data['resumo'],
                $data['status'],
                $data['tipo'] ?? 'avenca',
                $data['banco_horas_contratado'] ?? 0,
                $data['is_ilimitado'] ?? 0,
                $data['id']
            ]);
            
            echo json_encode(["status" => "success", "message" => "Registo atualizado."]);
            break;

        case 'DELETE':
            if (!isset($_GET['id'])) throw new Exception("ID não fornecido.");
            $stmt = $conn->prepare("DELETE FROM leads WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            echo json_encode(["status" => "success", "message" => "Registo removido."]);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
