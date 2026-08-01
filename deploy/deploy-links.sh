#!/bin/bash
set -e
cd /home/moin/projects/rizwan-wdding

git stash push -u -m 'temp-local' || true
git pull origin main

mkdir -p sql admin api
cp -f /tmp/rizwan-upload/guest_links.sql sql/guest_links.sql
cp -f /tmp/rizwan-upload/index.html admin/index.html
cp -f /tmp/rizwan-upload/admin.js admin/admin.js
cp -f /tmp/rizwan-upload/admin.css admin/admin.css
cp -f /tmp/rizwan-upload/admin.php api/admin.php

DB_USER=$(grep '^DB_USER=' .env | cut -d= -f2-)
DB_PASS=$(grep '^DB_PASS=' .env | cut -d= -f2-)
DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
DB_HOST=$(grep '^DB_HOST=' .env | cut -d= -f2-)

export MYSQL_PWD="$DB_PASS"
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < sql/guest_links.sql
echo TABLE_CREATED

php -r 'require "api/Database.php"; $db=Database::connection(); echo $db->query("SHOW TABLES LIKE \"guest_links\"")->fetch() ? "guest_links_ok\n" : "missing\n";'
git status -sb
