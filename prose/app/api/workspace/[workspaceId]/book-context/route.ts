import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type BookContextResponse,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentSummaries, documents } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = documentIdParamsSchema
			.pick({ id: true })
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.transform((val) => ({ workspaceId: val.workspaceId }))
			.parse({ workspaceId: (await params).workspaceId, id: (await params).workspaceId });

		// Get all documents with their summaries
		const docsWithSummaries = await db
			.select({
				documentId: documents.id,
				title: documents.title,
				summary: documentSummaries.summary,
			})
			.from(documents)
			.leftJoin(documentSummaries, eq(documents.id, documentSummaries.documentId))
			.where(eq(documents.workspaceId, workspaceId));

		// Filter to only those with summaries
		const bookContext: BookContextResponse = docsWithSummaries
			.filter((doc) => doc.summary !== null)
			.map((doc) => ({
				documentId: doc.documentId,
				title: doc.title,
				summary: doc.summary as string,
			}));

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
