import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";

import { DB_DIR, DB_URL } from "./path";
import * as schema from "./schema";

mkdirSync(DB_DIR, { recursive: true });

const client = createClient({ url: DB_URL });

export const db = drizzle(client, { schema });
