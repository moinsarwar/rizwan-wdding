<?php
require __DIR__ . '/../api/bootstrap.php';

echo "ADMIN_USER=" . env('ADMIN_USER') . PHP_EOL;
echo "ADMIN_PASS_LEN=" . strlen((string) env('ADMIN_PASS', '')) . PHP_EOL;
echo "ADMIN_PASS_EMPTY=" . (env('ADMIN_PASS', '') === '' ? 'yes' : 'no') . PHP_EOL;
echo "DB_NAME=" . env('DB_NAME') . PHP_EOL;
echo "DB_USER=" . env('DB_USER') . PHP_EOL;
echo "DB_PASS_LEN=" . strlen((string) env('DB_PASS', '')) . PHP_EOL;

try {
    require_once __DIR__ . '/../api/Database.php';
    $db = Database::connection();
    echo "DB_OK\n";
    $tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_NUM);
    foreach ($tables as $t) {
        echo "TABLE=" . $t[0] . PHP_EOL;
    }
    $count = $db->query('SELECT COUNT(*) FROM wishes')->fetchColumn();
    echo "WISHES_COUNT=" . $count . PHP_EOL;
} catch (Throwable $e) {
    echo "DB_FAIL=" . $e->getMessage() . PHP_EOL;
}
