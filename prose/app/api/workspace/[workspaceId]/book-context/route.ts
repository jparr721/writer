import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type BookContextResponse,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { bookFiles, documentSummaries, documents } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = documentIdParamsSchema
			.pick({ id: true })
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.transform((val) => ({ workspaceId: val.workspaceId }))
			.parse({ workspaceId: (await params).workspaceId, id: (await params).workspaceId });

		// Get chapter documents with summaries, ordered by book position
		const bookContext: BookContextResponse = await db
			.select({
				documentId: documents.id,
				title: documents.title,
				summary: documentSummaries.summary,
				position: bookFiles.position,
			})
			.from(bookFiles)
			.innerJoin(documents, eq(bookFiles.documentId, documents.id))
			.innerJoin(documentSummaries, eq(documents.id, documentSummaries.documentId))
			.where(and(eq(bookFiles.workspaceId, workspaceId), eq(bookFiles.nodeType, "chapter")))
			.orderBy(asc(bookFiles.position));

		return NextResponse.json<BookContextResponse>(bookContext);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid workspace id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch book context:", error);
		return NextResponse.json({ error: "Failed to fetch book context" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
