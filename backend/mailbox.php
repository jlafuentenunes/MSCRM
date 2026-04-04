<?php
/**
 * API de Gestão de Correio (Mailbox) - MsCRM
 * Trata da configuração de IMAP/SMTP e listagem de mensagens.
 */
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

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
                'validate_cert' => false,
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
                'validate_cert' => false,
                'username'      => $cfg['imap_user'],
                'password'      => $cfg['imap_pass'],
                'protocol'      => 'imap'
            ]);

            $client->connect();
            $folderName = $_GET['folder'] ?? 'INBOX';
            $folder = $client->getFolder($folderName);
            $messages = $folder->query()->all()->limit(10)->get();

            $list = [];
            foreach ($messages as $msg) {
                // Descodificar o assunto MIME (ex: =?utf-8?Q?...) para texto legível
                $subject = (string)$msg->getSubject();
                if (function_exists('mb_decode_mimeheader')) {
                    $subject = mb_decode_mimeheader($subject);
                }

                $list[] = [
                    'id' => $msg->getUid(),
                    'subject' => $subject,
                    'from' => (string)$msg->getFrom()[0]->mail,
                    'date' => $msg->getDate()[0]->format('Y-m-d H:i:s'),
                    'is_read' => $msg->getFlags()->has('seen'),
                ];
            }

        echo json_encode(["status" => "success", "messages" => $list]);
        break;

    case 'delete_message':
        $uid = $_GET['uid'] ?? '';
        $folderName = $_GET['folder'] ?? 'INBOX';
        if (!$uid) {
            echo json_encode(["status" => "error", "message" => "UID em falta."]);
            break;
        }

        try {
            $cm = new ClientManager();
            $client = $cm->make([
                'host'          => $cfg['imap_host'],
                'port'          => $cfg['imap_port'],
                'encryption'    => 'ssl',
                'validate_cert' => false,
                'username'      => $cfg['imap_user'],
                'password'      => $cfg['imap_pass'],
                'protocol'      => 'imap'
            ]);

            $client->connect();
            $folder = $client->getFolder($folderName);
            $msg = $folder->query()->getMessageByUid($uid);
            
            // Tentar encontrar a pasta de Lixo (Amen.pt costuma ser 'Trash' ou 'Lixo')
            $trash = $client->getFolder("Trash") ?: ($client->getFolder("Lixo") ?: $client->getFolder("Deleted"));
            
            if ($trash) {
                $msg->move($trash->full_name);
                echo json_encode(["status" => "success", "message" => "Mensagem movida para o Lixo."]);
            } else {
                // Se não houver lixeira, apenas marcamos para apagar (Gmail style delete)
                $msg->delete();
                echo json_encode(["status" => "success", "message" => "Mensagem marcada para eliminação."]);
            }
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao eliminar: " . $e->getMessage()]);
        }
        break;

    case 'send_message':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !($data['to'] ?? '')) {
            echo json_encode(["status" => "error", "message" => "Dados de envio incompletos."]);
            break;
        }

        $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
        try {
            // Configurar SMTP a partir das settings da DB
            $mail->isSMTP();
            $mail->Host       = $cfg['smtp_host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $cfg['smtp_user'];
            $mail->Password   = $cfg['smtp_pass'];
            $mail->SMTPSecure = \PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = $cfg['smtp_port'] ?: 465;

            // Remetente e Destinatário
            $mail->setFrom($cfg['imap_user'], 'MS360 CRM');
            $mail->addAddress($data['to']);
            
            // Assunto e Corpo
            $mail->isHTML(true);
            $mail->Subject = $data['subject'] ?? '(Sem Assunto)';
            $mail->Body    = $data['body'];
            $mail->AltBody = strip_tags($data['body']);

            $mail->send();
            echo json_encode(["status" => "success", "message" => "Email enviado com sucesso!"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Falha no envio: {$mail->ErrorInfo}"]);
        }
        break;

    case 'create_folder':
        $name = $_GET['name'] ?? '';
        if (!$name) {
            echo json_encode(["status" => "error", "message" => "Nome da pasta em falta."]);
            break;
        }

        try {
            $cm = new ClientManager();
            $client = $cm->make([
                'host'          => $cfg['imap_host'],
                'port'          => $cfg['imap_port'],
                'encryption'    => 'ssl',
                'validate_cert' => false,
                'username'      => $cfg['imap_user'],
                'password'      => $cfg['imap_pass'],
                'protocol'      => 'imap'
            ]);

            $client->connect();
            $client->createFolder($name);
            echo json_encode(["status" => "success", "message" => "Pasta '$name' criada com sucesso."]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao criar pasta: " . $e->getMessage()]);
        }
        break;

    case 'fetch_folders':
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
                'validate_cert' => false,
                'username'      => $cfg['imap_user'],
                'password'      => $cfg['imap_pass'],
                'protocol'      => 'imap'
            ]);

            $client->connect();
            $folders = $client->getFolders();
            $res = [];
            foreach ($folders as $f) {
                $res[] = [
                    'name' => $f->name,
                    'path' => (string)$f->path
                ];
            }
            echo json_encode(["status" => "success", "folders" => $res]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Erro ao listar pastas: " . $e->getMessage()]);
        }
        break;

    default:
        echo json_encode(["status" => "error", "message" => "Ação inválida."]);
        break;
}
