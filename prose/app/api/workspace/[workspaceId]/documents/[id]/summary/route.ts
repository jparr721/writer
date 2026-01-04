import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type DocumentSummaryResponse,
	documentIdParamsSchema,
	type ErrorResponse,
	upsertSummaryBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentSummaries, documents, workspaces } from "@/lib/db/schema";

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
		.select({ id: documents.id })
		.from(documents)
		.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
		.limit(1);

	if (!document) {
		return { error: "Document not found" } as const;
	}

	return { workspace, document } as const;
}

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const [summary] = await db
			.select()
			.from(documentSummaries)
			.where(
				and(eq(documentSummaries.workspaceId, workspaceId), eq(documentSummaries.documentId, id))
			);

		return NextResponse.json<DocumentSummaryResponse | null>(summary ?? null);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch document summary:", error);
		return NextResponse.json(
			{ error: "Failed to fetch document summary" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);
		const body = upsertSummaryBodySchema.parse(await request.json());

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const now = new Date();

		const [summary] = await db
			.insert(documentSummaries)
			.values({
				workspaceId,
				documentId: id,
				summary: body.summary,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentSummaries.workspaceId, documentSummaries.documentId],
				set: { summary: body.summary, updatedAt: now },
			})
			.returning();

		return NextResponse.json<DocumentSummaryResponse>(summary);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to upsert document summary:", error);
		return NextResponse.json(
			{ error: "Failed to upsert document summary" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}
