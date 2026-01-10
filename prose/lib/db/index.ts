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
