// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents table has been removed from the schema
// Book context now needs to read titles from filesystem

import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type BookContextResponse,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { bookFiles, documentSummaries } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = documentIdParamsSchema
			.pick({ id: true })
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.transform((val) => ({ workspaceId: val.workspaceId }))
			.parse({ workspaceId: (await params).workspaceId, id: (await params).workspaceId });

		// Get chapter files with summaries, ordered by book position
		// TODO: Filesystem refactor - title should come from filesystem, not database
		const bookFilesWithSummaries = await db
			.select({
				filePath: bookFiles.filePath,
				summary: documentSummaries.summary,
				position: bookFiles.position,
			})
			.from(bookFiles)
			.innerJoin(
				documentSummaries,
				and(
					eq(bookFiles.workspaceId, documentSummaries.workspaceId),
					eq(bookFiles.filePath, documentSummaries.filePath)
				)
			)
			.where(and(eq(bookFiles.workspaceId, workspaceId), eq(bookFiles.nodeType, "chapter")))
			.orderBy(asc(bookFiles.position));

		// Convert to BookContextResponse format
		// TODO: Filesystem refactor - read actual titles from filesystem
		const bookContext: BookContextResponse = bookFilesWithSummaries.map((item) => ({
			filePath: item.filePath,
			title: item.filePath.split("/").pop() || item.filePath, // Use filename as title placeholder
			summary: item.summary,
			position: item.position,
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
