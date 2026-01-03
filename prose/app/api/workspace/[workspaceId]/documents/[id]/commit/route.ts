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
import { documentDrafts, documents, workspaces } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

async function ensureWorkspaceAndDocument(workspaceId: string, documentId: string) {
	const [workspace] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);

	if (!workspace) {
		return { error: "Workspace not found" } as const;
	}

	const [document] = await db
		.select()
		.from(documents)
		.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
		.limit(1);

	if (!document) {
		return { error: "Document not found" } as const;
	}

	return { workspace, document } as const;
}

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);
		const body = commitDocumentBodySchema.parse(await request.json());

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

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
