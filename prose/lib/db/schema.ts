import {
	boolean,
	foreignKey,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const workspaces = pgTable("workspaces", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const folders = pgTable(
	"folders",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: varchar("name", { length: 255 }).notNull(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		parentId: uuid("parent_id"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "folders_parent_id_folders_id_fk",
		}).onDelete("cascade"),
		index("idx_folders_workspace_parent").on(table.workspaceId, table.parentId),
		uniqueIndex("idx_folders_workspace_parent_name").on(
			table.workspaceId,
			table.parentId,
			table.name
		),
	]
);

export const documents = pgTable(
	"documents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: varchar("title", { length: 255 }).notNull().default("Untitled"),
		content: text("content").notNull().default(""),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		folderId: uuid("folder_id").references(() => folders.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("idx_documents_workspace_updated_at").on(table.workspaceId, table.updatedAt.desc()),
		index("idx_documents_workspace_folder_id").on(table.workspaceId, table.folderId),
	]
);

export const documentDrafts = pgTable(
	"document_drafts",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		content: text("content").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_document_drafts_workspace_document").on(table.workspaceId, table.documentId),
	]
);

// Document Summaries - AI-generated chapter summaries for book context
export const documentSummaries = pgTable(
	"document_summaries",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		summary: text("summary").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("idx_document_summaries_workspace_document").on(
			table.workspaceId,
			table.documentId
		),
	]
);

// Help Suggestions - stores helper AI responses for user reference
export const helpSuggestions = pgTable(
	"help_suggestions",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		prompt: text("prompt").notNull(),
		response: text("response").notNull(),
		completed: boolean("completed").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("idx_help_suggestions_workspace_document").on(table.workspaceId, table.documentId),
	]
);

// Consistency check type enum
export const consistencyCheckTypeEnum = pgEnum("consistency_check_type", [
	"punctuation",
	"repetition",
	"tense",
	"combined",
]);

// Consistency Checks - stores checker AI results tied to drafts
export const consistencyChecks = pgTable(
	"consistency_checks",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		documentId: uuid("document_id")
			.notNull()
			.references(() => documents.id, { onDelete: "cascade" }),
		draftId: uuid("draft_id")
			.notNull()
			.references(() => documentDrafts.id, { onDelete: "cascade" }),
		line: integer("line").notNull(),
		original: text("original").notNull(),
		fixed: text("fixed").notNull(),
		type: consistencyCheckTypeEnum("type").notNull(),
		acknowledged: boolean("acknowledged").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_consistency_checks_draft").on(table.draftId)]
);

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentDraft = typeof documentDrafts.$inferSelect;
export type NewDocumentDraft = typeof documentDrafts.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type DocumentSummary = typeof documentSummaries.$inferSelect;
export type NewDocumentSummary = typeof documentSummaries.$inferInsert;
export type HelpSuggestion = typeof helpSuggestions.$inferSelect;
export type NewHelpSuggestion = typeof helpSuggestions.$inferInsert;
export type ConsistencyCheck = typeof consistencyChecks.$inferSelect;
export type NewConsistencyCheck = typeof consistencyChecks.$inferInsert;
