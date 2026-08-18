CREATE TABLE `admin_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`github_login` text NOT NULL,
	`encrypted_token` text NOT NULL,
	`encrypted_refresh_token` text,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `app_config` (
	`key` text PRIMARY KEY NOT NULL,
	`encrypted_value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`state` text PRIMARY KEY NOT NULL,
	`code_verifier` text NOT NULL,
	`expires_at` integer NOT NULL
);
