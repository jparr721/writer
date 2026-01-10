# SQLite Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Prose from PostgreSQL to SQLite using libsql driver, storing database at `~/.prose/prose.db`.

**Architecture:** Replace postgres-js driver with @libsql/client. Convert all PostgreSQL-specific schema types to SQLite equivalents. Delete existing migrations and regenerate fresh.

**Tech Stack:** Drizzle ORM, @libsql/client, SQLite

---

## Task 1: Update Dependencies

**Files:**
- Modify: `prose/package.json`

**Step 1: Remove postgres and add libsql**

In `package.json`, change the dependencies:

Remove this line from dependencies:
```json
"postgres": "^3.4.7",
```

Add this line to dependencies:
```json
"@libsql/client": "^0.15.0",
```

**Step 2: Install dependencies**

Run: `cd prose && bun install`

Expected: Installation succeeds with @libsql/client added

**Step 3: Commit**

```bash
git add prose/package.json prose/bun.lock
git commit -m "chore: replace postgres with libsql for SQLite support"
```

---

## Task 2: Update Database Connection

**Files:**
- Modify: `prose/lib/db/index.ts`

**Step 1: Replace PostgreSQL connection with SQLite**

Replace the entire contents of `prose/lib/db/index.ts` with:

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import * as schema from "./schema";

const dbDir = join(homedir(), ".prose");
mkdirSync(dbDir, { recursive: true });

const client = createClient({
	url: `file:${join(dbDir, "prose.db")}`,
});

export const db = drizzle(client, { schema });
```

**Step 2: Commit**

```bash
git add prose/lib/db/index.ts
git commit -m "feat: switch database connection from PostgreSQL to SQLite"
```

---

## Task 3: Update Drizzle Config

**Files:**
- Modify: `prose/drizzle.config.ts`

**Step 1: Change dialect to SQLite**

Replace the entire contents of `prose/drizzle.config.ts` with:

```typescript
import { defineConfig } from "drizzle-kit";
import { homedir } from "node:os";
import { join } from "node:path";

export default defineConfig({
	schema: "./lib/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: `file:${join(homedir(), ".prose", "prose.db")}`,
	},
});
```

**Step 2: Commit**

```bash
git add prose/drizzle.config.ts
git commit -m "chore: update drizzle config for SQLite dialect"
```

---

## Task 4: Convert Schema to SQLite

**Files:**
- Modify: `prose/lib/db/schema.ts`

**Step 1: Replace entire schema with SQLite version**

Replace the entire contents of `prose/lib/db/schema.ts` with:

```typescript
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
```

**Key changes:**
- `pgTable` → `sqliteTable`
- `uuid()` → `text()` with `$defaultFn(() => crypto.randomUUID())`
- `timestamp()` → `integer({ mode: "timestamp" })`
- `boolean()` → `integer({ mode: "boolean" })`
- `pgEnum` → TypeScript type + `text().$type<T>()`
- Removed `documents` and `folders` tables (filesystem refactor)
- Changed `documentId` to `filePath` in all metadata tables
- Added `rootPath` to workspaces

**Step 2: Commit**

```bash
git add prose/lib/db/schema.ts
git commit -m "feat: convert schema from PostgreSQL to SQLite with filePath keys"
```

---

## Task 5: Delete Old Migrations

**Files:**
- Delete: `prose/drizzle/*.sql`
- Delete: `prose/drizzle/meta/*.json`

**Step 1: Remove all migration files**

Run:
```bash
rm -rf prose/drizzle/*
```

**Step 2: Commit**

```bash
git add -A prose/drizzle/
git commit -m "chore: remove PostgreSQL migrations for fresh SQLite start"
```

---

## Task 6: Generate Fresh Migrations

**Files:**
- Create: `prose/drizzle/0000_*.sql` (auto-generated)

**Step 1: Generate SQLite migrations**

Run: `cd prose && bun db:generate`

Expected: Drizzle creates migration files in `prose/drizzle/`

**Step 2: Verify migration was created**

Run: `ls prose/drizzle/`

Expected: See `0000_*.sql` file and `meta/` folder

**Step 3: Commit**

```bash
git add prose/drizzle/
git commit -m "feat: add initial SQLite migration"
```

---

## Task 7: Apply Migrations

**Step 1: Run migrations to create database**

Run: `cd prose && bun db:migrate`

Expected: Migration applies, creates `~/.prose/prose.db`

**Step 2: Verify database was created**

Run: `ls ~/.prose/`

Expected: See `prose.db` file

---

## Task 8: Fix API Route Imports

**Files:**
- Modify: Multiple API routes that import removed tables

The schema no longer exports `documents` or `folders`. API routes importing these will break. This task fixes the immediate import errors so the build passes. Full filesystem refactor is a separate effort.

**Step 1: Find files importing removed tables**

Run: `grep -r "documents\|folders" prose/app/api --include="*.ts" -l`

These files need updates as part of the filesystem refactor. For now, we need to ensure the build doesn't break on missing imports.

**Step 2: Update imports in affected files**

For each file importing `documents` or `folders` from `@/lib/db/schema`:
- Remove the import
- Comment out or stub the code using these tables
- Add `// TODO: Filesystem refactor` comment

This is temporary - the filesystem refactor will replace these with fs operations.

**Step 3: Commit**

```bash
git add prose/app/api/
git commit -m "chore: stub out document/folder database references for filesystem refactor"
```

---

## Task 9: Verify Build

**Step 1: Run build**

Run: `cd prose && bun build`

Expected: Build completes without database connection errors

**Step 2: Run dev server**

Run: `cd prose && bun dev`

Expected: Server starts on http://localhost:3000

**Step 3: Commit any remaining fixes**

If any additional fixes were needed:
```bash
git add -A
git commit -m "fix: resolve remaining SQLite migration issues"
```

---

## Summary

After completing all tasks:
- Database: `~/.prose/prose.db` (SQLite via libsql)
- Driver: `@libsql/client` (Bun-compatible)
- Schema: SQLite types with `filePath` keys instead of `documentId`
- Tables removed: `documents`, `folders` (moved to filesystem)
- Tables kept: `workspaces`, `documentDrafts`, `documentSummaries`, `helpSuggestions`, `consistencyChecks`, `bookFiles`
