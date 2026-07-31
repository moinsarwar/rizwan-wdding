<?php

declare(strict_types=1);

require_once __DIR__ . '/Database.php';

corsHeaders();

function requireAdmin(): void
{
    if (empty($_SESSION['admin_logged_in'])) {
        jsonResponse(['ok' => false, 'error' => 'Unauthorized'], 401);
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

try {
    if ($method === 'GET' && $action === 'me') {
        jsonResponse([
            'ok' => true,
            'authenticated' => !empty($_SESSION['admin_logged_in']),
            'user' => $_SESSION['admin_user'] ?? null,
        ]);
    }

    if ($method === 'POST' && $action === 'login') {
        $body = readJsonBody();
        $user = trim((string) ($body['username'] ?? ''));
        $pass = (string) ($body['password'] ?? '');

        $adminUser = env('ADMIN_USER', 'admin');
        $adminPass = env('ADMIN_PASS', '');

        if ($adminPass === '' || $user !== $adminUser || !hash_equals($adminPass, $pass)) {
            jsonResponse(['ok' => false, 'error' => 'Invalid username or password.'], 401);
        }

        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $adminUser;

        jsonResponse(['ok' => true, 'user' => $adminUser]);
    }

    if ($method === 'POST' && $action === 'logout') {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        jsonResponse(['ok' => true]);
    }

    requireAdmin();
    $db = Database::connection();

    if ($method === 'GET' && ($action === '' || $action === 'list')) {
        $stmt = $db->query(
            'SELECT id, name, guests, rsvp, message, reply, replied_at, created_at
             FROM wishes
             ORDER BY created_at DESC'
        );
        jsonResponse(['ok' => true, 'data' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $action === 'reply') {
        $body = readJsonBody();
        $id = (int) ($body['id'] ?? 0);
        $reply = trim((string) ($body['reply'] ?? ''));

        if ($id < 1) {
            jsonResponse(['ok' => false, 'error' => 'Invalid wish id.'], 422);
        }

        if ($reply === '') {
            jsonResponse(['ok' => false, 'error' => 'Reply cannot be empty.'], 422);
        }

        if (mb_strlen($reply) > 2000) {
            jsonResponse(['ok' => false, 'error' => 'Reply is too long.'], 422);
        }

        $stmt = $db->prepare(
            'UPDATE wishes
             SET reply = :reply, replied_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([
            ':reply' => $reply,
            ':id' => $id,
        ]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['ok' => false, 'error' => 'Wish not found.'], 404);
        }

        $fetch = $db->prepare(
            'SELECT id, name, guests, rsvp, message, reply, replied_at, created_at
             FROM wishes WHERE id = :id'
        );
        $fetch->execute([':id' => $id]);

        jsonResponse(['ok' => true, 'data' => $fetch->fetch()]);
    }

    if ($method === 'POST' && $action === 'delete') {
        $body = readJsonBody();
        $id = (int) ($body['id'] ?? 0);

        if ($id < 1) {
            jsonResponse(['ok' => false, 'error' => 'Invalid wish id.'], 422);
        }

        $stmt = $db->prepare('DELETE FROM wishes WHERE id = :id');
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) {
            jsonResponse(['ok' => false, 'error' => 'Wish not found.'], 404);
        }

        jsonResponse(['ok' => true]);
    }

    jsonResponse(['ok' => false, 'error' => 'Unknown action.'], 404);
} catch (Throwable $e) {
    jsonResponse([
        'ok' => false,
        'error' => 'Server error. Please check database settings.',
    ], 500);
}
