<?php

declare(strict_types=1);

define('SKIP_ADMIN_SESSION', true);

require_once __DIR__ . '/Database.php';

corsHeaders();

/**
 * Public guest lookup by invite UUID.
 * GET /api/guest.php?g={uuid}
 */
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method !== 'GET') {
        jsonResponse(['ok' => false, 'error' => 'Method not allowed.'], 405);
    }

    $uuid = trim((string) ($_GET['g'] ?? $_GET['uuid'] ?? ''));

    if ($uuid === '' || !preg_match('/^[0-9a-fA-F-]{36}$/', $uuid)) {
        jsonResponse(['ok' => false, 'error' => 'Invalid invite link.'], 422);
    }

    $db = Database::connection();
    $stmt = $db->prepare(
        'SELECT guest_name
         FROM guest_links
         WHERE uuid = :uuid
         LIMIT 1'
    );
    $stmt->execute([':uuid' => strtolower($uuid)]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['ok' => false, 'error' => 'Invite not found.'], 404);
    }

    jsonResponse([
        'ok' => true,
        'guest_name' => $row['guest_name'],
    ]);
} catch (Throwable $e) {
    error_log('[rizwan-guest] ' . $e->getMessage());
    jsonResponse([
        'ok' => false,
        'error' => 'Server error.',
    ], 500);
}
