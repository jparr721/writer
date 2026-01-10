import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const workspaces = sqliteTable("workspaces", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull().unique(),
	rootPath: text("root_path").notNull().unique(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const documentDrafts = sqliteTable(
	"document_drafts",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		filePath: text("file_path").notNull(),
		content: text("content").notNull().default(""),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [uniqueIndex("idx_document_drafts_workspace_file").on(table.workspaceId, table.filePath)]
);

export const documentSummaries = sqliteTable(
	"document_summaries",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		filePath: text("file_path").notNull(),
		summary: text("summary").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [uniqueIndex("idx_document_summaries_workspace_file").on(table.workspaceId, table.filePath)]
);

export const helpSuggestions = sqliteTable(
	"help_suggestions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		filePath: text("file_path").notNull(),
		prompt: text("prompt").notNull(),
		response: text("response").notNull(),
		completed: integer("completed", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("idx_help_suggestions_workspace_file").on(table.workspaceId, table.filePath)]
);

// Consistency check types stored as text (SQLite has no enums)
export type ConsistencyCheckType = "punctuation" | "repetition" | "tense" | "combined";

export const consistencyChecks = sqliteTable(
	"consistency_checks",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		filePath: text("file_path").notNull(),
		draftId: text("draft_id")
			.notNull()
			.references(() => documentDrafts.id, { onDelete: "cascade" }),
		line: integer("line").notNull(),
		original: text("original").notNull(),
		fixed: text("fixed").notNull(),
		type: text("type").$type<ConsistencyCheckType>().notNull(),
		acknowledged: integer("acknowledged", { mode: "boolean" }).notNull().default(false),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index("idx_consistency_checks_draft").on(table.draftId)]
);

// Book file node types stored as text
export type NodeType = "chapter" | "appendix" | "frontmatter" | "backmatter";

export const bookFiles = sqliteTable(
	"book_files",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		workspaceId: text("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		filePath: text("file_path").notNull(),
		nodeType: text("node_type").$type<NodeType>().notNull(),
		position: integer("position").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("idx_book_files_workspace_file").on(table.workspaceId, table.filePath),
		index("idx_book_files_workspace_position").on(table.workspaceId, table.position),
	]
);

// Type exports
export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type DocumentDraft = typeof documentDrafts.$inferSelect;
export type NewDocumentDraft = typeof documentDrafts.$inferInsert;
export type DocumentSummary = typeof documentSummaries.$inferSelect;
export type NewDocumentSummary = typeof documentSummaries.$inferInsert;
export type HelpSuggestion = typeof helpSuggestions.$inferSelect;
export type NewHelpSuggestion = typeof helpSuggestions.$inferInsert;
export type ConsistencyCheck = typeof consistencyChecks.$inferSelect;
export type NewConsistencyCheck = typeof consistencyChecks.$inferInsert;
export type BookFile = typeof bookFiles.$inferSelect;
export type NewBookFile = typeof bookFiles.$inferInsert;
