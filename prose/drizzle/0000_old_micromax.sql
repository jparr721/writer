CREATE TABLE `book_files` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`file_path` text NOT NULL,
	`node_type` text NOT NULL,
	`position` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_book_files_workspace_file` ON `book_files` (`workspace_id`,`file_path`);--> statement-breakpoint
CREATE INDEX `idx_book_files_workspace_position` ON `book_files` (`workspace_id`,`position`);--> statement-breakpoint
CREATE TABLE `consistency_checks` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`file_path` text NOT NULL,
	`draft_id` text NOT NULL,
	`line` integer NOT NULL,
	`original` text NOT NULL,
	`fixed` text NOT NULL,
	`type` text NOT NULL,
	`acknowledged` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`draft_id`) REFERENCES `document_drafts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_consistency_checks_draft` ON `consistency_checks` (`draft_id`);--> statement-breakpoint
CREATE TABLE `document_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`file_path` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_drafts_workspace_file` ON `document_drafts` (`workspace_id`,`file_path`);--> statement-breakpoint
CREATE TABLE `document_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`file_path` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_document_summaries_workspace_file` ON `document_summaries` (`workspace_id`,`file_path`);--> statement-breakpoint
CREATE TABLE `help_suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`file_path` text NOT NULL,
	`prompt` text NOT NULL,
	`response` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_help_suggestions_workspace_file` ON `help_suggestions` (`workspace_id`,`file_path`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`root_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_name_unique` ON `workspaces` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_root_path_unique` ON `workspaces` (`root_path`);