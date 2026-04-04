<?php
/**
 * Motor de Auditoria e Notificações - MS360
 * Verifica saldos críticos e faturas pendentes a cada carregamento
 */

require_once 'config.php';
session_start();

// Configuração de Headers
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

try {
    $conn = getDatabaseConnection();
    $method = $_SERVER['REQUEST_METHOD'];

    // 1. Auditoria Silenciosa (Executa a cada GET para garantir alertas frescos)
    if ($method === 'GET') {
        runAudit($conn);
    }

    switch($method) {
        case 'GET':
            // Buscar notificações (apenas as top 10 ou todas)
            $stmt = $conn->query("SELECT * FROM notificacoes ORDER BY data_criacao DESC LIMIT 15");
            $notifs = $stmt->fetchAll();
            $unread = $conn->query("SELECT COUNT(*) FROM notificacoes WHERE is_read = 0")->fetchColumn();
            
            echo json_encode(["notifications" => $notifs, "unread_count" => intval($unread)]);
            break;

        case 'PUT':
            // Marcar como lida
            $data = json_decode(file_get_contents("php://input"), true);
            if (isset($data['mark_all'])) {
                $conn->exec("UPDATE notificacoes SET is_read = 1");
            } else {
                $stmt = $conn->prepare("UPDATE notificacoes SET is_read = 1 WHERE id = ?");
                $stmt->execute([$data['id']]);
            }
            echo json_encode(["status" => "success"]);
            break;
            
        case 'DELETE':
             // Limpar histórico
             $conn->exec("DELETE FROM notificacoes WHERE is_read = 1");
             echo json_encode(["status" => "success"]);
             break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

/**
 * Motor de Auditoria do MS360
 */
function runAudit($conn) {
    $hoje = date('Y-m-d');
    
    // A. Verificar Saldos Críticos (< 2 horas)
    $stmtH = $conn->query("SELECT id, nome, banco_horas_restantes FROM leads 
                           WHERE is_ilimitado = 0 AND banco_horas_restantes < 2");
    while ($lead = $stmtH->fetch()) {
        $msg = "Atenção: O cliente {$lead['nome']} tem apenas {$lead['banco_horas_restantes']}h restantes.";
        $titulo = "Saldo de Horas Crítico";
        
        // Evitar duplicados para o mesmo dia e lead
        $check = $conn->prepare("SELECT id FROM notificacoes WHERE lead_id = ? AND titulo = ? AND data_criacao >= CURDATE()");
        $check->execute([$lead['id'], $titulo]);
        if (!$check->fetch()) {
             $conn->prepare("INSERT INTO notificacoes (tipo, titulo, mensagem, lead_id) VALUES ('aviso', ?, ?, ?)")
                  ->execute([$titulo, $msg, $lead['id']]);
        }
    }
    
    // B. Verificar Faturações Pendentes (Vencidas ou para Hoje)
    $stmtB = $conn->query("SELECT b.id, b.valor, l.nome as lead_nome, l.id as lead_id 
                           FROM billing_alerts b JOIN leads l ON b.lead_id = l.id 
                           WHERE b.proxima_fatura <= CURDATE()");
    while ($bill = $stmtB->fetch()) {
        $msg = "Pagamento Pendente: O cliente {$bill['lead_nome']} tem um valor de {$bill['valor']}€ para cobrar.";
        $titulo = "Faturação Urgente";
        
        $check = $conn->prepare("SELECT id FROM notificacoes WHERE lead_id = ? AND titulo = ? AND data_criacao >= CURDATE()");
        $check->execute([$bill['lead_id'], $titulo]);
        if (!$check->fetch()) {
             $conn->prepare("INSERT INTO notificacoes (tipo, titulo, mensagem, lead_id) VALUES ('erro', ?, ?, ?)")
                  ->execute([$titulo, $msg, $bill['lead_id']]);
        }
    }

    /* 
    if ($cfg) {
        try {
            // ... (Commented to avoid IMAP session locking)
        } catch (\Exception $e) {}
    }
    */
}
?>
