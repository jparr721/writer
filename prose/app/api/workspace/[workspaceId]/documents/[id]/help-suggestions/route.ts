import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	documentIdParamsSchema,
	type ErrorResponse,
	type HelpSuggestionListResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents, helpSuggestions, workspaces } from "@/lib/db/schema";

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

		const suggestions = await db
			.select()
			.from(helpSuggestions)
			.where(and(eq(helpSuggestions.workspaceId, workspaceId), eq(helpSuggestions.documentId, id)))
			.orderBy(desc(helpSuggestions.createdAt));

		return NextResponse.json<HelpSuggestionListResponse>(suggestions);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch help suggestions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch help suggestions" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}
