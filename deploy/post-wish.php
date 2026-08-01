<?php
$payload = json_encode([
    'name' => 'Moin',
    'message' => 'hi',
    'guests' => 1,
    'rsvp' => 'attending',
]);

$ch = curl_init('https://rizwan-wedding.sytes.net/api/wishes.php');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_RETURNTRANSFER => true,
]);
echo curl_exec($ch), PHP_EOL;
