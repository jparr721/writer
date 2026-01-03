import { index, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const documents = pgTable(
	"documents",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		title: varchar("title", { length: 255 }).notNull().default("Untitled"),
		content: text("content").notNull().default(""),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_documents_updated_at").on(table.updatedAt.desc())]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
