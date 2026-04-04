<?php
/**
 * Motor de Agendamento de Lembretes - MS360
 * Suporta regras complexas como "primeira segunda do mês"
 */

require_once 'config.php';
session_start();

// Configuração de Headers (CORS e Segurança)
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

    switch($method) {
        case 'GET':
            // Listagem de lembretes com dados da lead
            $sql = "SELECT lp.*, l.nome as lead_nome, l.empresa as lead_empresa 
                    FROM lembretes_pagamento lp 
                    JOIN leads l ON lp.lead_id = l.id 
                    ORDER BY lp.proxima_data ASC";
            $stmt = $conn->query($sql);
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Calcular proxima data inicial baseada na regra
            $regra = $data['regra_recorrencia'] ?? ''; // Ex: "first monday", "day 1"
            $proxima = calculateNextDate($regra, $data['data_inicio']);
            
            $sql = "INSERT INTO lembretes_pagamento (lead_id, assunto, valor, tipo_recorrencia, regra_recorrencia, data_inicio, data_fim, proxima_data, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $data['lead_id'], $data['assunto'], $data['valor'], $data['tipo_recorrencia'],
                $regra, $data['data_inicio'], $data['data_fim'] ?: null, $proxima, 'ativo'
            ]);
            
            echo json_encode(["status" => "success", "id" => $conn->lastInsertId(), "proxima_data" => $proxima]);
            break;

        case 'DELETE':
            $stmt = $conn->prepare("DELETE FROM lembretes_pagamento WHERE id = ?");
            $stmt->execute([intval($_GET['id'])]);
            echo json_encode(["status" => "success"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

/**
 * Função Inteligente para calcular agendamentos
 * Aceita regras como "first monday", "last day", "day 5"
 */
function calculateNextDate($rule, $startDate) {
    $now = time();
    $start = strtotime($startDate);
    
    // Se a data de início fôr no futuro, começamos por aí
    $base = ($start > $now) ? $start : $now;
    
    // Se não houver regra específica (tipo_recorrencia = mensal simples)
    if (empty($rule)) {
         return date('Y-m-d', strtotime('+1 month', $base));
    }
    
    // Processar regras especiais usando strtotime do PHP (extremamente flexível)
    // Ex: "first monday of next month"
    try {
        if (strpos($rule, 'monday') !== false || strpos($rule, 'tuesday') !== false || strpos($rule, 'wednesday') !== false) {
             return date('Y-m-d', strtotime("$rule of next month", $base));
        }
        
        if (strpos($rule, 'day') !== false) {
             // Ex: "day 5" -> 5 do próximo mês
             preg_match('/\d+/', $rule, $matches);
             $dayNum = $matches[0] ?? 1;
             return date('Y-m-d', strtotime("first day of next month + ".($dayNum-1)." days", $base));
        }
    } catch(Exception $e) {}

    return date('Y-m-d', strtotime('+1 month', $base));
}
?>
