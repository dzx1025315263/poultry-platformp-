CREATE TABLE `poultry_trade_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`country` varchar(200) NOT NULL,
	`countryCode` varchar(10),
	`year` int NOT NULL,
	`importValueUsd` text,
	`importQuantityTons` text,
	`unitPriceUsd` text,
	`yoyChange` text,
	`hsCode` varchar(20) DEFAULT '0207',
	`source` varchar(100) DEFAULT 'UN Comtrade',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `poultry_trade_data_id` PRIMARY KEY(`id`)
);
