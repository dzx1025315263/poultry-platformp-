CREATE TABLE `ab_test_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`variantA_subject` varchar(500),
	`variantA_body` text,
	`variantB_subject` varchar(500),
	`variantB_body` text,
	`variantA_sent` int DEFAULT 0,
	`variantA_opened` int DEFAULT 0,
	`variantA_replied` int DEFAULT 0,
	`variantB_sent` int DEFAULT 0,
	`variantB_opened` int DEFAULT 0,
	`variantB_replied` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ab_test_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `backup_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileUrl` text,
	`fileSize` int,
	`recordCount` int,
	`backupType` enum('manual','scheduled') DEFAULT 'manual',
	`createdByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backup_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`title` varchar(200),
	`email` varchar(320),
	`phone` varchar(100),
	`linkedin` text,
	`isPrimary` boolean DEFAULT false,
	`addedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_credit_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`registeredCapital` varchar(200),
	`foundedYear` int,
	`importFrequency` enum('unknown','rare','occasional','frequent','very_frequent') DEFAULT 'unknown',
	`cooperationHistory` enum('none','inquiry','sample','trial_order','regular') DEFAULT 'none',
	`creditScore` int DEFAULT 0,
	`ratedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_credit_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_lifecycle` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyId` int NOT NULL,
	`stage` enum('prospect','contacted','quoted','won','repurchase') NOT NULL DEFAULT 'prospect',
	`dealValue` text,
	`expectedCloseDate` timestamp,
	`notes` text,
	`movedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_lifecycle_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_region_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`continent` varchar(100),
	`country` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_region_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `country` text NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `continent` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `companies` MODIFY COLUMN `hasPurchasedFromChina` varchar(500) DEFAULT '否';