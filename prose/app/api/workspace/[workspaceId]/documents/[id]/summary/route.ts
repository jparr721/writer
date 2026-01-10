// TODO: Filesystem refactor - this route now uses filePath instead of documentId
// The [id] param now represents a URL-encoded filePath

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	type DocumentSummaryResponse,
	type ErrorResponse,
	upsertSummaryBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentSummaries } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.string(), // This is now the filePath (URL-encoded)
});

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

		const [summary] = await db
			.select()
			.from(documentSummaries)
			.where(
				and(eq(documentSummaries.workspaceId, workspaceId), eq(documentSummaries.filePath, filePath))
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
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);
		const body = upsertSummaryBodySchema.parse(await request.json());

		const now = new Date();

		const [summary] = await db
			.insert(documentSummaries)
			.values({
				workspaceId,
				filePath,
				summary: body.summary,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentSummaries.workspaceId, documentSummaries.filePath],
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
