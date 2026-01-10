// TODO: Filesystem refactor - this route now uses filePath instead of documentId
// The [id] param now represents a URL-encoded filePath

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	type ErrorResponse,
	type HelpSuggestionResponse,
	type SuccessResponse,
	updateHelpSuggestionBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { helpSuggestions } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string; suggestionId: string }> };

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.string(), // This is now the filePath (URL-encoded)
	suggestionId: z.uuid(),
});

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id, suggestionId } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

		const [suggestion] = await db
			.select()
			.from(helpSuggestions)
			.where(
				and(
					eq(helpSuggestions.workspaceId, workspaceId),
					eq(helpSuggestions.filePath, filePath),
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
		const filePath = decodeURIComponent(id);
		const body = updateHelpSuggestionBodySchema.parse(await request.json());

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
					eq(helpSuggestions.filePath, filePath),
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
		const filePath = decodeURIComponent(id);

		const [deleted] = await db
			.delete(helpSuggestions)
			.where(
				and(
					eq(helpSuggestions.workspaceId, workspaceId),
					eq(helpSuggestions.filePath, filePath),
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
