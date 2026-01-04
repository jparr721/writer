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
import { documentSummaries } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

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
