CREATE TABLE `analysis_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`sampleName` varchar(160) NOT NULL,
	`species` varchar(80) NOT NULL,
	`source` enum('reference','upload','camera') NOT NULL,
	`videoFileName` varchar(255) NOT NULL,
	`videoUrl` text,
	`videoMetadataJson` text NOT NULL,
	`calibrationJson` text NOT NULL,
	`thresholdsJson` text NOT NULL,
	`metricsJson` text NOT NULL,
	`tracksJson` text NOT NULL,
	`qualityFlagsJson` text NOT NULL,
	`status` enum('complete','review_required') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analysis_records_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lab_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`settingsJson` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lab_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `lab_settings_ownerId_unique` UNIQUE(`ownerId`)
);
