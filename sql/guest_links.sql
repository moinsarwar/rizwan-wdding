USE `rizwan-wedding`;

CREATE TABLE IF NOT EXISTS guest_links (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  guest_name VARCHAR(160) NOT NULL,
  invite_url VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_guest_uuid (uuid),
  UNIQUE KEY uniq_guest_name (guest_name),
  INDEX idx_guest_links_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
