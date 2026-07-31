<?php

declare(strict_types=1);

require_once __DIR__ . '/Database.php';

corsHeaders();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    $db = Database::connection();

    if ($method === 'GET') {
        $stmt = $db->query(
            'SELECT id, name, guests, rsvp, message, reply, replied_at, created_at
             FROM wishes
             ORDER BY created_at DESC
             LIMIT 200'
        );
        $rows = $stmt->fetchAll();
        jsonResponse(['ok' => true, 'data' => $rows]);
    }

    if ($method === 'POST') {
        $body = readJsonBody();
        if ($body === []) {
            $body = $_POST;
        }

        $name = trim((string) ($body['name'] ?? ''));
        $message = trim((string) ($body['message'] ?? ''));
        $guests = (int) ($body['guests'] ?? 1);
        $rsvp = (string) ($body['rsvp'] ?? 'attending');

        $allowedRsvp = ['attending', 'maybe', 'declined'];

        if ($name === '' || $message === '') {
            jsonResponse(['ok' => false, 'error' => 'Name and message are required.'], 422);
        }

        if (mb_strlen($name) > 120) {
            jsonResponse(['ok' => false, 'error' => 'Name is too long.'], 422);
        }

        if (mb_strlen($message) > 2000) {
            jsonResponse(['ok' => false, 'error' => 'Message is too long.'], 422);
        }

        if ($guests < 1 || $guests > 20) {
            jsonResponse(['ok' => false, 'error' => 'Guests must be between 1 and 20.'], 422);
        }

        if (!in_array($rsvp, $allowedRsvp, true)) {
            jsonResponse(['ok' => false, 'error' => 'Invalid RSVP value.'], 422);
        }

        $stmt = $db->prepare(
            'INSERT INTO wishes (name, guests, rsvp, message)
             VALUES (:name, :guests, :rsvp, :message)'
        );
        $stmt->execute([
            ':name' => $name,
            ':guests' => $guests,
            ':rsvp' => $rsvp,
            ':message' => $message,
        ]);

        $id = (int) $db->lastInsertId();

        $fetch = $db->prepare(
            'SELECT id, name, guests, rsvp, message, reply, replied_at, created_at
             FROM wishes WHERE id = :id'
        );
        $fetch->execute([':id' => $id]);
        $row = $fetch->fetch();

        jsonResponse(['ok' => true, 'data' => $row], 201);
    }

    jsonResponse(['ok' => false, 'error' => 'Method not allowed.'], 405);
} catch (Throwable $e) {
    jsonResponse([
        'ok' => false,
        'error' => 'Server error. Please check database settings.',
    ], 500);
}
