import { defineConfig } from "drizzle-kit";

import { DB_URL } from "./lib/db/path";

export default defineConfig({
	schema: "./lib/db/schema.ts",
	out: "./drizzle",
	dialect: "sqlite",
	dbCredentials: {
		url: DB_URL,
	},
});
