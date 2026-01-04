import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	documentIdParamsSchema,
	type ErrorResponse,
	type HelpSuggestionResponse,
	type SuccessResponse,
	updateHelpSuggestionBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents, helpSuggestions, workspaces } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string; suggestionId: string }> };

const paramsSchema = documentIdParamsSchema.extend({
	workspaceId: z.uuid(),
	suggestionId: z.uuid(),
});

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
		const { workspaceId, id, suggestionId } = paramsSchema.parse(await params);

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const [suggestion] = await db
			.select()
			.from(helpSuggestions)
			.where(
				and(
					eq(helpSuggestions.workspaceId, workspaceId),
					eq(helpSuggestions.documentId, id),
					eq(helpSuggestions.id, suggestionId)
				)
			);

		if (!suggestion) {
			return NextResponse.json({ error: "Help suggestion not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<HelpSuggestionResponse>(suggestion);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid parameters" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch help suggestion:", error);
		return NextResponse.json({ error: "Failed to fetch help suggestion" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id, suggestionId } = paramsSchema.parse(await params);
		const body = updateHelpSuggestionBodySchema.parse(await request.json());

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const updateData: { response?: string; completed?: boolean; updatedAt: Date } = {
			updatedAt: new Date(),
		};
		if (body.response !== undefined) updateData.response = body.response;
		if (body.completed !== undefined) updateData.completed = body.completed;

		const [suggestion] = await db
			.update(helpSuggestions)
			.set(updateData)
			.where(
				and(
					eq(helpSuggestions.workspaceId, workspaceId),
					eq(helpSuggestions.documentId, id),
					eq(helpSuggestions.id, suggestionId)
				)
			)
			.returning();

		if (!suggestion) {
			return NextResponse.json({ error: "Help suggestion not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<HelpSuggestionResponse>(suggestion);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to update help suggestion:", error);
		return NextResponse.json(
			{ error: "Failed to update help suggestion" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id, suggestionId } = paramsSchema.parse(await params);

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const [deleted] = await db
			.delete(helpSuggestions)
			.where(
				and(
					eq(helpSuggestions.workspaceId, workspaceId),
					eq(helpSuggestions.documentId, id),
					eq(helpSuggestions.id, suggestionId)
				)
			)
			.returning();

		if (!deleted) {
			return NextResponse.json({ error: "Help suggestion not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<SuccessResponse>({ success: true });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid parameters" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to delete help suggestion:", error);
		return NextResponse.json(
			{ error: "Failed to delete help suggestion" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}
