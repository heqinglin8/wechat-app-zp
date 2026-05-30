-- Message board schema reference generated from utils/messageBoard.js.
-- Bmob uses Class fields rather than SQL DDL directly. This file maps the
-- required Bmob classes and fields to MySQL-compatible SQL types.

CREATE TABLE IF NOT EXISTS `MessageBoardMessage` (
  `objectId` VARCHAR(32) NOT NULL,
  `targetType` VARCHAR(32) NOT NULL,
  `targetId` VARCHAR(64) NOT NULL,
  `parentId` VARCHAR(64) NOT NULL DEFAULT '',
  `parentMessageId` VARCHAR(64) NOT NULL DEFAULT '',
  `authorId` VARCHAR(64) NOT NULL DEFAULT '',
  `authorName` VARCHAR(100) NOT NULL DEFAULT '',
  `authorAvatarPath` VARCHAR(500) NOT NULL DEFAULT '',
  `authorCity` VARCHAR(100) NOT NULL DEFAULT '',
  `content` TEXT NOT NULL,
  `imagePath` VARCHAR(500) NOT NULL DEFAULT '',
  `imageUrl` VARCHAR(1000) NOT NULL DEFAULT '',
  `imageWidth` INT UNSIGNED NOT NULL DEFAULT 0,
  `imageHeight` INT UNSIGNED NOT NULL DEFAULT 0,
  `isHidden` TINYINT(1) NOT NULL DEFAULT 0,
  `hiddenReason` VARCHAR(64) NOT NULL DEFAULT '',
  `isFeatured` TINYINT(1) NOT NULL DEFAULT 0,
  `isPinned` TINYINT(1) NOT NULL DEFAULT 0,
  `clientCreatedAt` DATETIME NULL COMMENT 'Legacy optional timestamp; new mini-program writes rely on Bmob createdAt.',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`objectId`),
  KEY `idx_msg_target_parent_visible_sort` (
    `targetType`,
    `targetId`,
    `parentId`,
    `isHidden`,
    `isPinned`,
    `createdAt`
  ),
  KEY `idx_msg_parent_visible_time` (`parentId`, `isHidden`, `createdAt`),
  KEY `idx_msg_author` (`authorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MessageBoardConfig` (
  `objectId` VARCHAR(32) NOT NULL,
  `key` VARCHAR(64) NOT NULL,
  `targetType` VARCHAR(32) NOT NULL DEFAULT '',
  `targetId` VARCHAR(64) NOT NULL DEFAULT '',
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `value` TINYINT(1) NULL,
  `globalMessageBoardEnabled` TINYINT(1) NULL,
  `detailMessageEnabled` TINYINT(1) NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`objectId`),
  UNIQUE KEY `uniq_config_scope` (`key`, `targetType`, `targetId`),
  KEY `idx_config_target` (`targetType`, `targetId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MessageBoardSensitiveWord` (
  `objectId` VARCHAR(32) NOT NULL,
  `word` VARCHAR(255) NOT NULL DEFAULT '',
  `words` TEXT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`objectId`),
  KEY `idx_sensitive_enabled_word` (`enabled`, `word`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MessageBoardMutedUser` (
  `objectId` VARCHAR(32) NOT NULL,
  `userId` VARCHAR(64) NOT NULL,
  `enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `muted` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`objectId`),
  UNIQUE KEY `uniq_muted_user` (`userId`),
  KEY `idx_muted_enabled` (`enabled`, `muted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional seed rows for switches. In Bmob, create equivalent records in
-- MessageBoardConfig if they do not already exist.
INSERT INTO `MessageBoardConfig` (
  `objectId`,
  `key`,
  `targetType`,
  `targetId`,
  `enabled`,
  `globalMessageBoardEnabled`
) VALUES (
  'global_message_board_enabled',
  'globalMessageBoardEnabled',
  '',
  '',
  1,
  1
) ON DUPLICATE KEY UPDATE
  `enabled` = VALUES(`enabled`),
  `globalMessageBoardEnabled` = VALUES(`globalMessageBoardEnabled`);
