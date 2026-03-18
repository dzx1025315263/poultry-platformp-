CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`targetTable` varchar(50),
	`targetId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`seqNo` int,
	`companyName` text NOT NULL,
	`country` varchar(100) NOT NULL,
	`continent` varchar(50) NOT NULL,
	`coreRole` text,
	`purchaseTendency` text,
	`companyProfile` text,
	`mainProducts` text,
	`websiteSocial` text,
	`contactInfo` text,
	`hasPurchasedFromChina` varchar(10) DEFAULT '否',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int,
	`recipients` text NOT NULL,
	`subject` varchar(500),
	`body` text,
	`sendType` enum('single','bcc') DEFAULT 'single',
	`status` enum('sent','failed') DEFAULT 'sent',
	`internalNote` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`followUpStatus` enum('new','contacted','negotiating','quoted','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`followUpDate` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inquiry_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(200),
	`contactPerson` varchar(100),
	`email` varchar(320),
	`phone` varchar(50),
	`destinationPort` varchar(200),
	`emailBody` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inquiry_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smtp_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`host` varchar(200) NOT NULL,
	`port` int NOT NULL,
	`secure` boolean DEFAULT true,
	`username` varchar(200) NOT NULL,
	`password` text NOT NULL,
	`fromName` varchar(200),
	`fromEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtp_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_shared_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`companyId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`followUpStatus` enum('new','contacted','negotiating','quoted','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`notes` text,
	`lastUpdatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_shared_companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`inviteCode` varchar(20) NOT NULL,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','editor') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `feishuUserId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `feishuUnionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;