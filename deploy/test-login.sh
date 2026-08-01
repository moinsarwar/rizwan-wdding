#!/bin/bash
set -e
cd /home/moin/projects/rizwan-wdding

echo "=== ENV CHECK ==="
php -r 'require "api/bootstrap.php"; echo env("ADMIN_USER"), "\n", strlen((string)env("ADMIN_PASS","")), "\n";'

echo "=== DB CHECK ==="
php -r 'require "api/Database.php"; $db=Database::connection(); echo "OK\n"; print_r($db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN));'

echo "=== LOGIN TEST ==="
curl -sS -c /tmp/rw_cookies.txt -b /tmp/rw_cookies.txt \
  -X POST "https://rizwan-wedding.sytes.net/api/admin.php?action=login" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{"username":"admin","password":"password"}
EOF
echo
echo "=== ME ==="
curl -sS -c /tmp/rw_cookies.txt -b /tmp/rw_cookies.txt \
  "https://rizwan-wedding.sytes.net/api/admin.php?action=me"
echo
echo "=== PHP ERROR LOG TAIL ==="
tail -n 30 /var/log/nginx/error.log 2>/dev/null || true
ls -la /var/log/php* 2>/dev/null || true
