#!/bin/bash
cd /home/moin/projects/rizwan-wdding || exit 1
git pull origin main
echo "=== admin.php include ==="
head -6 api/admin.php
echo "=== login ==="
printf '%s' '{"username":"admin","password":"password"}' > /tmp/login.json
curl -sS -c /tmp/rw.txt -b /tmp/rw.txt \
  -X POST 'https://rizwan-wedding.sytes.net/api/admin.php?action=login' \
  -H 'Content-Type: application/json' \
  --data-binary @/tmp/login.json
echo
echo "=== me ==="
curl -sS -c /tmp/rw.txt -b /tmp/rw.txt \
  'https://rizwan-wedding.sytes.net/api/admin.php?action=me'
echo
echo "=== wishes ==="
curl -sS 'https://rizwan-wedding.sytes.net/api/wishes.php'
echo
