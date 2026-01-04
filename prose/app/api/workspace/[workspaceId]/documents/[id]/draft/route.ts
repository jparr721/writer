import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type DocumentDraftResponse,
	documentIdParamsSchema,
	type ErrorResponse,
	type SuccessResponse,
	upsertDraftBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentDrafts } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

		const [draft] = await db
			.select()
			.from(documentDrafts)
			.where(and(eq(documentDrafts.workspaceId, workspaceId), eq(documentDrafts.documentId, id)));

		return NextResponse.json<DocumentDraftResponse | null>(draft ?? null);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch document draft:", error);
		return NextResponse.json({ error: "Failed to fetch document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);
		const body = upsertDraftBodySchema.parse(await request.json());

		const now = new Date();

		const [draft] = await db
			.insert(documentDrafts)
			.values({
				workspaceId,
				documentId: id,
				content: body.content,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentDrafts.workspaceId, documentDrafts.documentId],
				set: { content: body.content, updatedAt: now },
			})
			.returning();

		return NextResponse.json<DocumentDraftResponse>(draft);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to upsert document draft:", error);
		return NextResponse.json({ error: "Failed to upsert document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

		await db
			.delete(documentDrafts)
			.where(and(eq(documentDrafts.workspaceId, workspaceId), eq(documentDrafts.documentId, id)));

		return NextResponse.json<SuccessResponse>({ success: true });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to delete document draft:", error);
		return NextResponse.json({ error: "Failed to delete document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
