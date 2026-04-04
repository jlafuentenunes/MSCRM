<?php
/**
 * Gestão de Tickets e Banco de Horas - MS360
 * Utiliza PDO para consistência e segurança
 */

require_once 'config.php';
session_start();

// Configuração de Headers para permitir Sessão (withCredentials)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
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

try {
    $conn = getDatabaseConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    switch($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                $id = intval($_GET['id']);
                $stmt = $conn->prepare("SELECT t.*, l.nome as lead_nome, l.empresa as lead_empresa, l.banco_horas_restantes, l.is_ilimitado 
                                       FROM tickets t JOIN leads l ON t.lead_id = l.id WHERE t.id = ?");
                $stmt->execute([$id]);
                $ticket = $stmt->fetch();

                $stmtI = $conn->prepare("SELECT * FROM ticket_intervencoes WHERE ticket_id = ? ORDER BY data_intervencao DESC");
                $stmtI->execute([$id]);
                $intervencoes = $stmtI->fetchAll();

                echo json_encode(['ticket' => $ticket, 'intervencoes' => $intervencoes]);
            } else {
                $stmt = $conn->query("SELECT t.*, l.nome as lead_nome FROM tickets t JOIN leads l ON t.lead_id = l.id ORDER BY t.data_abertura DESC");
                echo json_encode($stmt->fetchAll());
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'intervencao') {
                $stmt = $conn->prepare("INSERT INTO ticket_intervencoes (ticket_id, descricao, minutos_gastos) VALUES (?, ?, ?)");
                $stmt->execute([$input['ticket_id'], $input['descricao'], $input['minutos_gastos']]);
                echo json_encode(['status' => 'success']);
            } else {
                $stmt = $conn->prepare("INSERT INTO tickets (lead_id, assunto, prioridade) VALUES (?, ?, ?)");
                $stmt->execute([$input['lead_id'], $input['assunto'], $input['prioridade'] ?? 'Média']);
                echo json_encode(['status' => 'success', 'id' => $conn->lastInsertId()]);
            }
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $id = intval($input['id']);
            
            if ($action === 'close') {
                // 1. Obter lead_id
                $stmt = $conn->prepare("SELECT lead_id FROM tickets WHERE id = ?");
                $stmt->execute([$id]);
                $lead_id = $stmt->fetchColumn();
                
                // 2. Somar minutos
                $stmtSum = $conn->prepare("SELECT SUM(minutos_gastos) FROM ticket_intervencoes WHERE ticket_id = ?");
                $stmtSum->execute([$id]);
                $total_minutos = $stmtSum->fetchColumn() ?: 0;
                $horas_a_descontar = $total_minutos / 60;
                
                // 3. Atualizar Saldo e Fechar Ticket (Transação ou query atómica)
                $conn->prepare("UPDATE leads SET banco_horas_restantes = banco_horas_restantes - ? 
                               WHERE id = ? AND is_ilimitado = 0")->execute([$horas_a_descontar, $lead_id]);
                
                $conn->prepare("UPDATE tickets SET status = 'Fechado', data_fecho = CURRENT_TIMESTAMP WHERE id = ?")->execute([$id]);
                
                echo json_encode(['status' => 'success', 'tempo_total' => $total_minutos]);
            } else {
                $conn->prepare("UPDATE tickets SET status = ? WHERE id = ?")->execute([$input['status'], $id]);
                echo json_encode(['status' => 'success']);
            }
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
