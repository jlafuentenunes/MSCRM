<?php
/**
 * API para Gestão de Alarmes de Faturação Recorrente
 * MsCRM - Monitor de Surpresas
 */

session_set_cookie_params(['samesite' => 'None', 'secure' => true]);
session_start();
require_once 'config.php';

// Segurança de Headers para React (CORS)
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

// Verificação de autenticação
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
            $sql = "SELECT b.*, l.nome as lead_nome, l.empresa as lead_empresa, 
                           DATEDIFF(b.proxima_fatura, CURDATE()) as dias_restantes
                    FROM billing_alerts b 
                    JOIN leads l ON b.lead_id = l.id 
                    ORDER BY b.proxima_fatura ASC";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            echo json_encode($stmt->fetchAll());
            break;

        case 'POST':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['lead_id']) || empty($data['valor']) || empty($data['proxima_fatura'])) {
                throw new Exception("Campos obrigatórios em falta.");
            }
            $sql = "INSERT INTO billing_alerts (lead_id, valor, periodicidade, regra_recorrencia, proxima_fatura, descricao) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $data['lead_id'], $data['valor'], $data['periodicidade'] ?? 'Mensal', 
                $data['regra_recorrencia'] ?? null, $data['proxima_fatura'], $data['descricao'] ?? null
            ]);
            echo json_encode(["status" => "success", "message" => "Alarme de faturação criado!"]);
            break;

        case 'PUT':
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['id'])) throw new Exception("ID necessário.");
            
            if (isset($data['renew']) && $data['renew'] === true) {
                // Lógica de Renovação Inteligente
                $stmt = $conn->prepare("SELECT * FROM billing_alerts WHERE id = ?");
                $stmt->execute([$data['id']]);
                $alert = $stmt->fetch();
                
                $regra = $alert['regra_recorrencia'] ?? '';
                $periodicidade = $alert['periodicidade'];
                
                if (!empty($regra)) {
                    $newData = calculateNextBillingDate($regra, $alert['proxima_fatura']);
                } else {
                    $intervalMap = ['Mensal' => '1 month', 'Trimestral' => '3 months', 'Semestral' => '6 months', 'Anual' => '1 year'];
                    $interval = $intervalMap[$periodicidade] ?? '1 month';
                    $newData = date('Y-m-d', strtotime($alert['proxima_fatura'] . ' + ' . $interval));
                }
                
                $stmt = $conn->prepare("UPDATE billing_alerts SET proxima_fatura = ? WHERE id = ?");
                $stmt->execute([$newData, $data['id']]);
                echo json_encode(["status" => "success", "message" => "Fatura renovada!", "nova_data" => $newData]);
            } else {
                $sql = "UPDATE billing_alerts SET valor=?, periodicidade=?, regra_recorrencia=?, proxima_fatura=?, status=?, descricao=? WHERE id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute([$data['valor'], $data['periodicidade'], $data['regra_recorrencia'], $data['proxima_fatura'], $data['status'], $data['descricao'], $data['id']]);
                echo json_encode(["status" => "success", "message" => "Alarme atualizado."]);
            }
            break;

        case 'DELETE':
            $data = json_decode(file_get_contents("php://input"), true);
            $id = $data['id'] ?? ($_GET['id'] ?? null);
            if (!$id) throw new Exception("ID necessário.");
            $stmt = $conn->prepare("DELETE FROM billing_alerts WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Alarme removido."]);
            break;
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

function calculateNextBillingDate($rule, $currentDate) {
    $base = strtotime($currentDate);
    // php strtotime permite "first monday", "last day", "day 15", etc.
    if (strpos($rule, 'monday') !== false || strpos($rule, 'tuesday') !== false || strpos($rule, 'wednesday') !== false || strpos($rule, 'thursday') !== false || strpos($rule, 'friday') !== false) {
         return date('Y-m-d', strtotime("$rule of next month", $base));
    }
    if (strpos($rule, 'day') !== false) {
         preg_match('/\d+/', $rule, $matches);
         if (isset($matches[0])) {
             $dayNum = $matches[0];
             return date('Y-m-d', strtotime("first day of next month + ".($dayNum-1)." days", $base));
         }
         return date('Y-m-d', strtotime("$rule of next month", $base)); // last day etc
    }
    return date('Y-m-d', strtotime('+1 month', $base));
}
?>
