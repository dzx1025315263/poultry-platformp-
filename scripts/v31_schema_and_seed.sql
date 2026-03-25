-- V3.1: Create new tables for enhanced production regions

CREATE TABLE IF NOT EXISTS `region_sub_area_prices` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `regionCode` varchar(10) NOT NULL,
  `subArea` varchar(200) NOT NULL,
  `subAreaLocal` varchar(200),
  `date` varchar(20) NOT NULL,
  `productType` varchar(50) NOT NULL,
  `productLabel` varchar(100),
  `price` text NOT NULL,
  `unit` varchar(30) NOT NULL,
  `priceUsd` text,
  `trend` varchar(10),
  `changePercent` text,
  `source` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `region_feed_prices` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `regionCode` varchar(10) NOT NULL,
  `date` varchar(20) NOT NULL,
  `feedType` varchar(50) NOT NULL,
  `feedLabel` varchar(100),
  `price` text NOT NULL,
  `unit` varchar(30) NOT NULL,
  `priceUsd` text,
  `trend` varchar(10),
  `changePercent` text,
  `source` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `region_disease_library` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `regionCode` varchar(10),
  `diseaseCategory` varchar(50) NOT NULL,
  `diseaseName` varchar(200) NOT NULL,
  `diseaseNameEn` varchar(200),
  `pathogen` varchar(200),
  `symptoms` text,
  `pathologicalChanges` text,
  `diagnosis` text,
  `prevention` text,
  `treatment` text,
  `vaccineInfo` text,
  `seasonalRisk` varchar(100),
  `prevalenceLevel` enum('endemic','sporadic','rare','emerging') DEFAULT 'sporadic',
  `economicImpact` text,
  `source` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `region_policies` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `regionCode` varchar(10) NOT NULL,
  `date` varchar(20) NOT NULL,
  `policyType` varchar(50) NOT NULL,
  `policyLabel` varchar(100),
  `title` varchar(500) NOT NULL,
  `summary` text,
  `content` text,
  `impactOnTrade` text,
  `effectiveDate` varchar(20),
  `status` enum('active','pending','expired') DEFAULT 'active',
  `source` varchar(200),
  `sourceUrl` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `region_company_profiles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `regionCode` varchar(10) NOT NULL,
  `companyName` varchar(300) NOT NULL,
  `companyNameLocal` varchar(300),
  `companyType` varchar(50),
  `annualCapacityMt` text,
  `annualRevenue` text,
  `employeeCount` text,
  `exportMarkets` text,
  `certifications` text,
  `recentNews` text,
  `website` text,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
