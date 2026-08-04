USE `rizwan-wedding`;

-- Run once on the live DB (ignore errors if column/index already exists)

ALTER TABLE guest_links
  ADD COLUMN uuid CHAR(36) NULL AFTER id;

ALTER TABLE guest_links
  ADD UNIQUE KEY uniq_guest_uuid (uuid);
