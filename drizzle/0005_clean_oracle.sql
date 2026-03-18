CREATE TABLE `weekly_market_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekLabel` varchar(50) NOT NULL,
	`reportDate` timestamp NOT NULL,
	`status` enum('generating','completed','failed') NOT NULL DEFAULT 'generating',
	`part1_macroLandscape` text,
	`part2_priceVerification` text,
	`part3_logisticsAlerts` text,
	`part4_keyAccountGuide` text,
	`part5_riskControl` text,
	`part6_actionItems` text,
	`references` text,
	`generatedByUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weekly_market_reports_id` PRIMARY KEY(`id`)
);
