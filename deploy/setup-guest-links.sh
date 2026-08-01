#!/bin/bash
cd /home/moin/projects/rizwan-wdding || exit 1
git pull origin main

# Load DB password from .env without printing it
DB_USER=$(grep '^DB_USER=' .env | cut -d= -f2-)
DB_PASS=$(grep '^DB_PASS=' .env | cut -d= -f2-)
DB_NAME=$(grep '^DB_NAME=' .env | cut -d= -f2-)
DB_HOST=$(grep '^DB_HOST=' .env | cut -d= -f2-)

export MYSQL_PWD="$DB_PASS"
mysql -h "$DB_HOST" -u "$DB_USER" "$DB_NAME" < sql/guest_links.sql
echo TABLE_OK

php -r 'require "api/Database.php"; $db=Database::connection(); $r=$db->query("SHOW TABLES LIKE \"guest_links\"")->fetch(); echo $r ? "guest_links_exists\n" : "missing\n";'
