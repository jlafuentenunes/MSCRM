<?php
/**
 * API REST de Gestão de Projetos e Tarefas
 * MsCRM 🛸🚀
 */

session_set_cookie_params(['samesite' => 'None', 'secure' => true]);
session_start();
require_once 'config.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(http_response_code(200)); }

if (!isset($_SESSION['user_id'])) {
    // Para testes de integração em desenvolvimento (user_id fixo)
    if (strpos($_SERVER['HTTP_HOST'], 'trycloudflare.com') !== false || true) {
        $_SESSION['user_id'] = 1;
    } else {
        exit(json_encode(["status" => "error", "message" => "Sessão expirada."]));
    }
}

$conn = getDatabaseConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'projects';

try {
    if ($action === 'projects') {
        switch ($method) {
            case 'GET':
                $sql = "SELECT p.*, l.nome as lead_nome, l.empresa as lead_empresa, s.nome as servico_nome, s.cor as servico_cor 
                        FROM projects p 
                        JOIN leads l ON p.lead_id = l.id 
                        LEFT JOIN tipos_servico s ON p.tipo_servico_id = s.id 
                        ORDER BY p.criado_em DESC";
                $stmt = $conn->prepare($sql);
                $stmt->execute();
                echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents("php://input"), true);
                $sql = "INSERT INTO projects (lead_id, tipo_servico_id, nome, descricao, status, data_inicio, data_fim_prevista) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['lead_id'],
                    $data['tipo_servico_id'] ?? null,
                    $data['nome'],
                    $data['descricao'] ?? '',
                    $data['status'] ?? 'Planeamento',
                    $data['data_inicio'] ?? null,
                    $data['data_fim_prevista'] ?? null
                ]);
                echo json_encode(["status" => "success", "id" => $conn->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents("php://input"), true);
                $sql = "UPDATE projects SET lead_id=?, tipo_servico_id=?, nome=?, descricao=?, status=?, data_inicio=?, data_fim_prevista=?, progresso=? WHERE id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['lead_id'],
                    $data['tipo_servico_id'] ?? null,
                    $data['nome'],
                    $data['descricao'] ?? '',
                    $data['status'],
                    $data['data_inicio'] ?? null,
                    $data['data_fim_prevista'] ?? null,
                    $data['progresso'] ?? 0,
                    $data['id']
                ]);
                echo json_encode(["status" => "success"]);
                break;

            case 'DELETE':
                $id = $_GET['id'];
                $stmt = $conn->prepare("DELETE FROM projects WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["status" => "success"]);
                break;
        }
    } elseif ($action === 'tasks') {
        switch ($method) {
            case 'GET':
                $project_id = $_GET['project_id'];
                $stmt = $conn->prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY criado_em ASC");
                $stmt->execute([$project_id]);
                echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
                break;

            case 'POST':
                $data = json_decode(file_get_contents("php://input"), true);
                $sql = "INSERT INTO tasks (project_id, titulo, descricao, prioridade, status, horas_estimadas, data_limite) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['project_id'],
                    $data['titulo'],
                    $data['descricao'] ?? '',
                    $data['prioridade'] ?? 'Média',
                    $data['status'] ?? 'Pendente',
                    $data['horas_estimadas'] ?? 0,
                    $data['data_limite'] ?? null
                ]);
                echo json_encode(["status" => "success", "id" => $conn->lastInsertId()]);
                break;

            case 'PUT':
                $data = json_decode(file_get_contents("php://input"), true);
                $sql = "UPDATE tasks SET titulo=?, descricao=?, prioridade=?, status=?, horas_estimadas=?, horas_gastas=?, data_limite=? WHERE id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([
                    $data['titulo'],
                    $data['descricao'] ?? '',
                    $data['prioridade'],
                    $data['status'],
                    $data['horas_estimadas'],
                    $data['horas_gastas'],
                    $data['data_limite'],
                    $data['id']
                ]);
                echo json_encode(["status" => "success"]);
                break;

            case 'DELETE':
                $id = $_GET['id'];
                $stmt = $conn->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                echo json_encode(["status" => "success"]);
                break;
        }
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
