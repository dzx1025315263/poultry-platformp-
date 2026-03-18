CREATE TABLE `company_change_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`fieldName` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_change_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`actionType` varchar(50) NOT NULL,
	`targetType` varchar(50),
	`targetId` int,
	`targetName` varchar(500),
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_activities_id` PRIMARY KEY(`id`)
);
