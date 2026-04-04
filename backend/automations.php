<?php
/**
 * API de Automações Flexíveis - MsCRM
 * Trata da criação, edição, remoção e listagem de regras automáticas.
 */
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once 'config.php';
$pdo = getDatabaseConnection();
$user_id = 1; // Para integração futura com Auth

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM automacoes WHERE id = ? AND user_id = ?");
                $stmt->execute([$_GET['id'], $user_id]);
                echo json_encode(["status" => "success", "data" => $stmt->fetch()]);
            } else if (isset($_GET['logs'])) {
                // Listar logs das últimas 24h
                $stmt = $pdo->prepare("SELECT l.*, a.nome as automacao_nome 
                                     FROM automacoes_logs l 
                                     JOIN automacoes a ON l.automacao_id = a.id 
                                     WHERE a.user_id = ? 
                                     ORDER BY l.data_execucao DESC LIMIT 50");
                $stmt->execute([$user_id]);
                echo json_encode(["status" => "success", "logs" => $stmt->fetchAll()]);
            } else {
                $stmt = $pdo->prepare("SELECT * FROM automacoes WHERE user_id = ? ORDER BY data_criacao DESC");
                $stmt->execute([$user_id]);
                echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) { throw new Exception("Dados inválidos"); }

            $sql = "INSERT INTO automacoes (user_id, nome, gatilho, gatilho_config, condicao, acao, acao_config, is_active) 
                    VALUES (:uid, :nome, :gatilho, :g_cfg, :cond, :acao, :a_cfg, :active)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'uid'    => $user_id,
                'nome'   => $data['nome'],
                'gatilho'=> $data['gatilho'],
                'g_cfg'  => json_encode($data['gatilho_config']),
                'cond'   => json_encode($data['condicao']),
                'acao'   => $data['acao'],
                'a_cfg'  => json_encode($data['acao_config']),
                'active' => $data['is_active'] ?? 1
            ]);

            echo json_encode(["status" => "success", "id" => $pdo->lastInsertId()]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (isset($data['toggle_active'])) {
                $stmt = $pdo->prepare("UPDATE automacoes SET is_active = NOT is_active WHERE id = ? AND user_id = ?");
                $stmt->execute([$data['id'], $user_id]);
            } else {
                 $sql = "UPDATE automacoes SET 
                        nome=:nome, gatilho=:gatilho, gatilho_config=:g_cfg, 
                        condicao=:cond, acao=:acao, acao_config=:a_cfg, is_active=:active 
                        WHERE id=:id AND user_id=:uid";
                 $stmt = $pdo->prepare($sql);
                 $stmt->execute([
                    'id'     => $data['id'],
                    'uid'    => $user_id,
                    'nome'   => $data['nome'],
                    'gatilho'=> $data['gatilho'],
                    'g_cfg'  => json_encode($data['gatilho_config']),
                    'cond'   => json_encode($data['condicao']),
                    'acao'   => $data['acao'],
                    'a_cfg'  => json_encode($data['acao_config']),
                    'active' => $data['is_active']
                 ]);
            }
            echo json_encode(["status" => "success"]);
            break;

        case 'DELETE':
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("DELETE FROM automacoes WHERE id = ? AND user_id = ?");
                $stmt->execute([$_GET['id'], $user_id]);
                echo json_encode(["status" => "success"]);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
