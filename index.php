<?php

declare(strict_types=1);

/**
 * Entry page for WhatsApp / social previews.
 * Personalizes Open Graph meta when ?g={uuid} is present.
 */

define('SKIP_ADMIN_SESSION', true);

require_once __DIR__ . '/api/Database.php';

$siteUrl = rtrim((string) env('APP_URL', 'https://rizwan-wedding.sytes.net'), '/');
$ogImage = $siteUrl . '/assets/og-cover.jpg?v=2';

$guestName = '';
$uuid = trim((string) ($_GET['g'] ?? $_GET['invite'] ?? ''));

if ($uuid !== '' && preg_match('/^[0-9a-fA-F-]{36}$/', $uuid)) {
    try {
        $stmt = Database::connection()->prepare(
            'SELECT guest_name FROM guest_links WHERE uuid = :uuid LIMIT 1'
        );
        $stmt->execute([':uuid' => strtolower($uuid)]);
        $row = $stmt->fetch();
        if ($row && !empty($row['guest_name'])) {
            $guestName = (string) $row['guest_name'];
        }
    } catch (Throwable $e) {
        error_log('[invite-meta] ' . $e->getMessage());
    }
}

$canonical = $siteUrl . '/';
if ($uuid !== '' && preg_match('/^[0-9a-fA-F-]{36}$/', $uuid)) {
    $canonical .= '?g=' . rawurlencode(strtolower($uuid));
}

if ($guestName !== '') {
    $title = 'Dear ' . $guestName . ', you\'re invited — Rizwan weds Ayesha';
    $description = 'Dear ' . $guestName . ', you are invited to the Reception of Muhammad Rizwan Arshad & Ayesha Yousaf — Sunday, 16 August 2026 · 7:00 PM at Rivaj Marque.';
} else {
    $title = 'Rizwan weds Ayesha — Wedding Invitation';
    $description = 'You are invited to the wedding reception of Muhammad Rizwan Arshad & Ayesha Yousaf — Sunday, 16 August 2026 · 7:00 PM at Rivaj Marque.';
}

$e = static fn (string $value): string => htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$shareMeta = <<<HTML
    <title>{$e($title)}</title>
    <meta name="description" content="{$e($description)}" />
    <link rel="canonical" href="{$e($canonical)}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Rizwan weds Ayesha" />
    <meta property="og:locale" content="en_PK" />
    <meta property="og:url" content="{$e($canonical)}" />
    <meta property="og:title" content="{$e($title)}" />
    <meta property="og:description" content="{$e($description)}" />
    <meta property="og:image" content="{$e($ogImage)}" />
    <meta property="og:image:secure_url" content="{$e($ogImage)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="{$e($title)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="{$e($title)}" />
    <meta name="twitter:description" content="{$e($description)}" />
    <meta name="twitter:image" content="{$e($ogImage)}" />
HTML;

$html = file_get_contents(__DIR__ . '/invitation.html');
if ($html === false) {
    http_response_code(500);
    echo 'Invitation unavailable.';
    exit;
}

$updated = preg_replace(
    '/<!-- SHARE_META -->.*?<!-- \\/SHARE_META -->/s',
    "<!-- SHARE_META -->\n" . $shareMeta . "\n    <!-- /SHARE_META -->",
    $html,
    1
);

if (!is_string($updated) || $updated === '') {
    $updated = $html;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
echo $updated;
