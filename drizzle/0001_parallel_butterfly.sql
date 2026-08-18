ALTER TABLE `admin_sessions` ADD `access_token_expires_at` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `admin_sessions` ADD `refresh_token_expires_at` integer;