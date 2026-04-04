<?php
/**
 * API de Gestão de Correio (Mailbox) - MsCRM
 * Trata da configuração de IMAP/SMTP e listagem de mensagens.
 */
header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once 'config.php';
require_once 'vendor/autoload.php';

use Webklex\PHPIMAP\ClientManager;
use Webklex\PHPIMAP\Client;

$pdo = getDatabaseConnection();
$action = $_GET['action'] ?? '';

// Em produção, deve haver verificação de sessão/JWT aqui
$user_id = 1; 

switch ($action) {
    case 'save_settings':
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!$data) {
            echo json_encode(["status" => "error", "message" => "Dados inválidos."]);
            break;
        }

        try {
            $sql = "INSERT INTO mail_settings 
                    (user_id, imap_host, imap_port, imap_user, imap_pass, smtp_host, smtp_port, smtp_user, smtp_pass)
                    VALUES (:uid, :ihost, :iport, :iuser, :ipass, :shost, :sport, :suser, :spass)
                    ON DUPLICATE KEY UPDATE 
                    imap_host=:ihost, imap_port=:iport, imap_user=:iuser, imap_pass=:ipass,
                    smtp_host=:shost, smtp_port=:sport, smtp_user=:suser, smtp_pass=:spass";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                'uid' => $user_id,
                'ihost' => $data['imap_host'],
                'iport' => $data['imap_port'] ?: 993,
                'iuser' => $data['imap_user'],
                'ipass' => $data['imap_pass'], // Em prod, encriptar!
                'shost' => $data['smtp_host'],
                'sport' => $data['smtp_port'] ?: 465,
                'suser' => $data['smtp_user'],
                'spass' => $data['smtp_pass'],
            ]);

            echo json_encode(["status" => "success", "message" => "Definições de email guardadas com sucesso."]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'get_settings':
        $stmt = $pdo->prepare("SELECT * FROM mail_settings WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $row = $stmt->fetch();
        echo json_encode(["status" => "success", "data" => $row ?: (object)[]]);
        break;

    case 'test_connection':
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            $cm = new ClientManager();
            $client = $cm->make([
                'host'          => $data['imap_host'],
                'port'          => $data['imap_port'],
                'encryption'    => 'ssl',
                'validate_cert' => true,
                'username'      => $data['imap_user'],
                'password'      => $data['imap_pass'],
                'protocol'      => 'imap'
            ]);

            // Tenta ligar
            $client->connect();
            echo json_encode(["status" => "success", "message" => "Ligação ao servidor IMAP bem-sucedida!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Falha na ligação: " . $e->getMessage()]);
        }
        break;

    case 'list_messages':
        // Carrega as configurações guardadas
        $stmt = $pdo->prepare("SELECT * FROM mail_settings WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $cfg = $stmt->fetch();

        if (!$cfg) {
            echo json_encode(["status" => "error", "message" => "Configuração de email não encontrada."]);
            break;
        }

        try {
            $cm = new ClientManager();
            $client = $cm->make([
                'host'          => $cfg['imap_host'],
                'port'          => $cfg['imap_port'],
                'encryption'    => 'ssl',
                'validate_cert' => true,
                'username'      => $cfg['imap_user'],
                'password'      => $cfg['imap_pass'],
                'protocol'      => 'imap'
            ]);

            $client->connect();
            $folder = $client->getFolder("INBOX");
            $messages = $folder->query()->limit(10)->get();

            $list = [];
            foreach ($messages as $msg) {
                $list[] = [
                    'id' => $msg->getUid(),
                    'subject' => $msg->getSubject(),
                    'from' => $msg->getFrom()[0]->mail,
                    'date' => $msg->getDate()[0]->format('Y-m-d H:i:s'),
                    'is_read' => $msg->getFlags()->has('seen'),
                ];
            }

            echo json_encode(["status" => "success", "messages" => $list]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao listar mensagens: " . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Ação inválida."]);
        break;
}
