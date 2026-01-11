import { homedir } from "node:os";
import { join } from "node:path";

export const DB_DIR = join(homedir(), ".prose");
export const DB_PATH = join(DB_DIR, "prose.db");
export const DB_URL = `file:${DB_PATH}`;
