<?php
/**
 * API de Gestão de Tipos de Serviço - MsCRM
 * Trata da listagem e edição das categorias de negócio.
 */
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once 'config.php';
$pdo = getDatabaseConnection();

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM tipos_servico ORDER BY nome ASC");
            echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) { throw new Exception("Dados inválidos"); }
            $stmt = $pdo->prepare("INSERT INTO tipos_servico (nome, descricao, icone, cor) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['nome'], $data['descricao'] ?? '', $data['icone'], $data['cor']]);
            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            $stmt = $pdo->prepare("UPDATE tipos_servico SET nome=?, descricao=?, icone=?, cor=? WHERE id=?");
            $stmt->execute([$data['nome'], $data['descricao'] ?? '', $data['icone'], $data['cor'], $data['id']]);
            echo json_encode(["status" => "success"]);
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("DELETE FROM tipos_servico WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                echo json_encode(["status" => "success"]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
