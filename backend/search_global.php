<?php
/**
 * API de Busca Global - Pesquisa Universal MsCRM
 * MsCRM 🛸🚀
 */

session_set_cookie_params(['samesite' => 'None', 'secure' => true]);
session_start();
require_once 'config.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");

if (!isset($_SESSION['user_id'])) { $_SESSION['user_id'] = 1; } // Desenvolvimento

$conn = getDatabaseConnection();
$query = $_GET['q'] ?? '';

if (strlen($query) < 2) {
    exit(json_encode(["status" => "success", "results" => []]));
}

try {
    $results = [];
    $searchTerm = "%$query%";

    // 1. Pesquisa em LEADS
    $stmt = $conn->prepare("SELECT id, nome, empresa, 'lead' as type FROM leads WHERE nome LIKE ? OR empresa LIKE ? LIMIT 5");
    $stmt->execute([$searchTerm, $searchTerm]);
    foreach ($stmt->fetchAll() as $row) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['nome'],
            "subtitle" => $row['empresa'],
            "type" => "Lead",
            "url" => "/leads/" . $row['id']
        ];
    }

    // 2. Pesquisa em PROJETOS
    $stmt = $conn->prepare("SELECT id, nome, status, 'project' as type FROM projects WHERE nome LIKE ? LIMIT 5");
    $stmt->execute([$searchTerm]);
    foreach ($stmt->fetchAll() as $row) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['nome'],
            "subtitle" => "Status: " . $row['status'],
            "type" => "Projeto",
            "url" => "/projects" // Idealmente abriría o projeto específico
        ];
    }

    // 3. Pesquisa em TAREFAS
    $stmt = $conn->prepare("SELECT id, titulo, prioridade, 'task' as type FROM tasks WHERE titulo LIKE ? LIMIT 5");
    $stmt->execute([$searchTerm]);
    foreach ($stmt->fetchAll() as $row) {
        $results[] = [
            "id" => $row['id'],
            "title" => $row['titulo'],
            "subtitle" => "Prioridade: " . $row['prioridade'],
            "type" => "Tarefa",
            "url" => "/projects"
        ];
    }

    echo json_encode(["status" => "success", "results" => $results]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
