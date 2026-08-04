CREATE DATABASE IF NOT EXISTS `rizwan-wedding`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `rizwan-wedding`;

CREATE TABLE IF NOT EXISTS wishes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  guests TINYINT UNSIGNED NOT NULL DEFAULT 1,
  rsvp ENUM('attending', 'maybe', 'declined') NOT NULL DEFAULT 'attending',
  message TEXT NOT NULL,
  reply TEXT NULL,
  replied_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_rsvp (rsvp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
