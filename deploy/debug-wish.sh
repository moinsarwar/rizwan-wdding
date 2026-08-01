#!/bin/bash
cd /home/moin/projects/rizwan-wdding || exit 1

echo "=== ENV (masked) ==="
grep -E '^(DB_|ADMIN_)' .env | sed -E 's/(PASS)=.*/\1=***/'
ls -la .env

echo "=== TABLE ==="
php -r 'require "api/Database.php"; $db=Database::connection(); foreach($db->query("DESCRIBE wishes") as $r){echo $r["Field"]."|".$r["Type"]."|".$r["Null"]."|".$r["Default"]."\n";}'

echo "=== POST WISH ==="
printf '%s' '{"name":"Test Guest","message":"hi from server test","guests":1,"rsvp":"attending"}' > /tmp/wish.json
curl -sS -X POST 'https://rizwan-wedding.sytes.net/api/wishes.php' \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/wish.json
echo

echo "=== GET WISHES ==="
curl -sS 'https://rizwan-wedding.sytes.net/api/wishes.php'
echo

echo "=== NGINX ERROR TAIL ==="
tail -n 20 /var/log/nginx/error.log
