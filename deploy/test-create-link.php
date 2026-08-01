<?php
$cookieFile = '/tmp/rw_admin.txt';

function req($url, $payload = null, $cookieFile) {
    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_COOKIEJAR => $cookieFile,
        CURLOPT_COOKIEFILE => $cookieFile,
    ];
    if ($payload !== null) {
        $opts[CURLOPT_POST] = true;
        $opts[CURLOPT_HTTPHEADER] = ['Content-Type: application/json'];
        $opts[CURLOPT_POSTFIELDS] = $payload;
    }
    curl_setopt_array($ch, $opts);
    $body = curl_exec($ch);
    echo $body, PHP_EOL;
}

// login with env password
require __DIR__ . '/../api/bootstrap.php';
$pass = env('ADMIN_PASS', '');
req(
    'https://rizwan-wedding.sytes.net/api/admin.php?action=login',
    json_encode(['username' => env('ADMIN_USER', 'admin'), 'password' => $pass]),
    $cookieFile
);
req(
    'https://rizwan-wedding.sytes.net/api/admin.php?action=create-link',
    json_encode(['guest_name' => 'Mahad Khan Chugtai']),
    $cookieFile
);
req(
    'https://rizwan-wedding.sytes.net/api/admin.php?action=links',
    null,
    $cookieFile
);
