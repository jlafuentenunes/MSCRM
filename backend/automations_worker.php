<?php
/**
 * Motor de Execução de Automações (Worker) - MsCRM
 * Este script deve correr via Cronjob (ex: a cada 5 ou 15 min)
 */

require_once 'config.php';
require_once 'vendor/autoload.php';

use Webklex\PHPIMAP\ClientManager;
use PHPMailer\PHPMailer\PHPMailer;

$pdo = getDatabaseConnection();

// 1. Buscar todas as automações ativas
$stmt = $pdo->prepare("SELECT * FROM automacoes WHERE is_active = 1");
$stmt->execute();
$rules = $stmt->fetchAll();

$agora = date('H:i');
$hoje = date('Y-m-d');

foreach ($rules as $rule) {
    try {
        $gatilho_cfg = json_decode($rule['gatilho_config'], true);
        $acao_cfg = json_decode($rule['acao_config'], true);
        $executar = false;

        // A. Avaliar Gatilho
        switch ($rule['gatilho']) {
            case 'horario':
                // Verifica se a hora coincide e se ainda não correu hoje
                if ($gatilho_cfg['hora'] === $agora) {
                    $last_run_date = $rule['last_run'] ? date('Y-m-d', strtotime($rule['last_run'])) : '';
                    if ($last_run_date !== $hoje) {
                        $executar = true;
                    }
                }
                break;
            
            case 'saldo_critico':
                // Verifica todas as leads com saldo < 2h que ainda não foram notificadas hoje por esta regra
                $stmtH = $pdo->query("SELECT id, nome, email, banco_horas_restantes FROM leads 
                                      WHERE is_ilimitado = 0 AND banco_horas_restantes < 2");
                $leadsCríticas = $stmtH->fetchAll();
                if (count($leadsCríticas) > 0) {
                    foreach ($leadsCríticas as $lead) {
                        // Verifica se já correu para ESTA lead hoje
                        $checkL = $pdo->prepare("SELECT id FROM automacoes_logs 
                                               WHERE automacao_id = ? AND resultado LIKE ? AND data_execucao >= CURDATE()");
                        $checkL->execute([$rule['id'], "%Lead: {$lead['id']}%"]);
                        if (!$checkL->fetch()) {
                            $executar = true;
                            $contexto_lead = $lead; // Guarda para usar na ação
                            break; // Executamos uma por ciclo para evitar timeouts, ou corremos todas
                        }
                    }
                }
                break;
        }

        if ($executar) {
            // B. Executar Ação
            $resultado = "";
            switch ($rule['acao']) {
                case 'enviar_resumo':
                    $resultado = executeSendSummary($pdo, $rule['user_id'], $acao_cfg['destinatario']);
                    break;
                case 'enviar_email_cliente':
                    if (isset($contexto_lead)) {
                        $resultado = executeSendToClient($pdo, $rule['user_id'], $contexto_lead, $acao_cfg['mensagem']);
                    }
                    break;
                case 'notificacao_push':
                    // Criar entrada na tabela 'notificacoes' (o sino)
                    $stmtN = $pdo->prepare("INSERT INTO notificacoes (tipo, titulo, mensagem) VALUES ('info', 'Automação: ' || :nome, 'Executada com sucesso')");
                    $stmtN->execute(['nome' => $rule['nome']]);
                    $resultado = "Notificação criada no sino.";
                    break;
            }

            // C. Registar Sucesso e Atualizar Last Run
            $pdo->prepare("UPDATE automacoes SET last_run = NOW() WHERE id = ?")->execute([$rule['id']]);
            logAutomation($pdo, $rule['id'], 'sucesso', $resultado);
        }

    } catch (Exception $e) {
        logAutomation($pdo, $rule['id'], 'erro', $e->getMessage());
    }
}

/**
 * Lógica específica: Gerar resumo IMAP e enviar via SMTP
 */
function executeSendSummary($pdo, $user_id, $to) {
    // 1. Obter definições de mail
    $stmt = $pdo->prepare("SELECT * FROM mail_settings WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $cfg = $stmt->fetch();
    if (!$cfg) return "Erro: Configuração de email não encontrada.";

    // 2. Ler IMAP (Últimas 24h)
    $cm = new ClientManager();
    $client = $cm->make([
        'host' => $cfg['imap_host'], 'port' => $cfg['imap_port'], 'encryption' => 'ssl',
        'username' => $cfg['imap_user'], 'password' => $cfg['imap_pass'], 'protocol' => 'imap'
    ]);
    $client->connect();
    $folder = $client->getFolder("INBOX");
    $messages = $folder->query()->since(now()->subDay())->get();

    $html = "<h2>Resumo Diário de Correio - MS360</h2>";
    $html .= "<p>Tens " . $messages->count() . " mensagens novas/recentes:</p><ul>";
    foreach ($messages as $msg) {
        $html .= "<li><strong>" . $msg->getSubject() . "</strong> de " . $msg->getFrom()[0]->mail . "</li>";
    }
    $html .= "</ul><p>Aceda ao CRM para responder.</p>";

    // 3. Enviar via SMTP
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $cfg['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $cfg['smtp_user'];
    $mail->Password   = $cfg['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $cfg['smtp_port'];

    $mail->setFrom($cfg['smtp_user'], 'Ms360 Automations');
    $mail->addAddress($to);
    $mail->isHTML(true);
    $mail->Subject = 'Ms360: O teu resumo diário';
    $mail->Body    = $html;
    $mail->CharSet = 'UTF-8';

    $mail->send();
    return "Resumo enviado com sucesso para $to (" . $messages->count() . " emails).";
}

/**
 * Envia um email automático ao cliente (Lead)
 */
function executeSendToClient($pdo, $user_id, $lead, $template) {
    $stmt = $pdo->prepare("SELECT * FROM mail_settings WHERE user_id = ?");
    $stmt->execute([$user_id]);
    $cfg = $stmt->fetch();
    if (!$cfg) return "Erro: SMTP não configurado.";

    // Personalizar template básica
    $mensagem = str_replace("[NOME]", $lead['nome'], $template);
    $mensagem = str_replace("[HORAS]", $lead['banco_horas_restantes'], $mensagem);

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = $cfg['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $cfg['smtp_user'];
    $mail->Password   = $cfg['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = $cfg['smtp_port'];

    $mail->setFrom($cfg['smtp_user'], 'Ms360 Suporte Automático');
    $mail->addAddress($lead['email']);
    $mail->isHTML(true);
    $mail->Subject = 'Aviso Importante: Banco de Horas MS360';
    $mail->Body    = nl2br($mensagem);
    $mail->CharSet = 'UTF-8';

    $mail->send();
    return "Email enviado à Lead: {$lead['id']} ({$lead['email']}). Mensagem personalizada.";
}

function logAutomation($pdo, $id, $status, $res) {
    $stmt = $pdo->prepare("INSERT INTO automacoes_logs (automacao_id, status, resultado) VALUES (?, ?, ?)");
    $stmt->execute([$id, $status, $res]);
}
