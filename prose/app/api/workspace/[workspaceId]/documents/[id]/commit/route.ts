import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	commitDocumentBodySchema,
	type DocumentResponse,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentDrafts, documents } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);
		const body = commitDocumentBodySchema.parse(await request.json());

		const [updatedDocument] = await db
			.update(documents)
			.set({
				content: body.content,
				updatedAt: new Date(),
			})
			.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, id)))
			.returning();

		await db
			.delete(documentDrafts)
			.where(and(eq(documentDrafts.workspaceId, workspaceId), eq(documentDrafts.documentId, id)));

		return NextResponse.json<DocumentResponse>(updatedDocument);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to commit document draft:", error);
		return NextResponse.json({ error: "Failed to commit document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
