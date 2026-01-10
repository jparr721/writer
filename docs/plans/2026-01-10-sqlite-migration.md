# PostgreSQL to SQLite Migration

Migrate Prose from PostgreSQL to SQLite using libsql driver, keeping Drizzle ORM. This is a destructive migration with no backwards compatibility.

## Overview

- **Database location:** `~/.prose/prose.db`
- **Driver:** `@libsql/client` (Bun-compatible)
- **ORM:** Drizzle with `drizzle-orm/libsql`

## Dependencies

**Remove:**
- `postgres` (postgres-js driver)

**Add:**
- `@libsql/client`

## Database Connection

**New file: `prose/lib/db/index.ts`**

```typescript
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { join } from "path";
import { mkdirSync } from "fs";
import { homedir } from "os";
import * as schema from "./schema";

const dbDir = join(homedir(), ".prose");
mkdirSync(dbDir, { recursive: true });

const client = createClient({
  url: `file:${join(dbDir, "prose.db")}`,
});

export const db = drizzle(client, { schema });
```

**Update `drizzle.config.ts`:**

```typescript
import { defineConfig } from "drizzle-kit";
import { join } from "path";
import { homedir } from "os";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: `file:${join(homedir(), ".prose", "prose.db")}`,
  },
});
```

## Schema Changes

Replace PostgreSQL imports and types with SQLite equivalents:

```typescript
// Before
import { pgTable, uuid, text, timestamp, ... } from "drizzle-orm/pg-core";

// After
import { sqliteTable, text, integer, ... } from "drizzle-orm/sqlite-core";
```

### Type Mappings

| PostgreSQL | SQLite | Notes |
|------------|--------|-------|
| `uuid()` | `text()` | Use `crypto.randomUUID()` in app code |
| `timestamp()` | `integer({ mode: "timestamp" })` | Unix epoch seconds |
| `serial()` | `integer().primaryKey({ autoIncrement: true })` | Auto-increment |
| `boolean()` | `integer({ mode: "boolean" })` | 0/1 storage |
| `jsonb()` | `text({ mode: "json" })` | JSON as text |

### Example Transformation

```typescript
// Before
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// After
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  rootPath: text("root_path").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
```

## Migrations

**Delete existing migrations:**
- Remove all files in `prose/drizzle/` (SQL files and metadata)

**Regenerate from scratch:**
```bash
cd prose
bun db:generate   # Creates fresh SQLite migrations from schema
bun db:migrate    # Applies to ~/.prose/prose.db
```

### Final Table List

| Table | Purpose |
|-------|---------|
| `workspaces` | id, name, rootPath, entrypoint, createdAt |
| `documentDrafts` | workspaceId, filePath, content, updatedAt |
| `documentSummaries` | workspaceId, filePath, summary, updatedAt |
| `helpSuggestions` | workspaceId, filePath, suggestion, createdAt |
| `consistencyChecks` | workspaceId, filePath, checks (json), createdAt |
| `bookFiles` | workspaceId, filePath, position |

### Removed Tables

- `documents` (content now on filesystem)
- `folders` (structure now from filesystem)

## Files to Modify

### Database Layer

| File | Change |
|------|--------|
| `lib/db/schema.ts` | Rewrite with SQLite types, add rootPath, remove documents/folders |
| `lib/db/index.ts` | New file - libsql connection with ~/.prose path |
| `drizzle.config.ts` | Switch dialect to sqlite, update dbCredentials |
| `package.json` | Remove `postgres`, add `@libsql/client` |

### Delete

- `prose/drizzle/*.sql` - old PostgreSQL migrations
- `prose/drizzle/meta/*.json` - migration metadata

### PostgreSQL Syntax to Replace

- `::jsonb` casts
- `ILIKE` → `LIKE` with `COLLATE NOCASE`
- `NOW()` → handle in app code
- Array operations → use JSON arrays

## Implementation Order

1. **Dependencies** - Remove `postgres`, add `@libsql/client`, run `bun install`
2. **Database connection** - Create `lib/db/index.ts`, update `drizzle.config.ts`
3. **Schema rewrite** - Convert to SQLite types, add rootPath, remove documents/folders tables
4. **Clean migrations** - Delete `drizzle/` contents, run `bun db:generate`
5. **Fix queries** - Search for PostgreSQL-specific syntax, update to SQLite equivalents
6. **Test** - Run `bun db:migrate`, start dev server, verify workspace creation
