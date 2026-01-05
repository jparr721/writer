CREATE TYPE "public"."node_type" AS ENUM('chapter', 'appendix', 'frontmatter', 'backmatter');--> statement-breakpoint
CREATE TABLE "book_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"node_type" "node_type" NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "book_files" ADD CONSTRAINT "book_files_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "book_files" ADD CONSTRAINT "book_files_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_book_files_workspace_document" ON "book_files" USING btree ("workspace_id","document_id");--> statement-breakpoint
CREATE INDEX "idx_book_files_workspace_position" ON "book_files" USING btree ("workspace_id","position");