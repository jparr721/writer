ALTER TABLE "documents" ADD COLUMN "extension" varchar(32);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "original_modified_at" timestamp with time zone;