// TODO: Filesystem refactor - this route now uses filePath instead of documentId
// The [id] param now represents a URL-encoded filePath

import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import type { ErrorResponse, HelpSuggestionListResponse } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { helpSuggestions } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.string(), // This is now the filePath (URL-encoded)
});

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

		const suggestions = await db
			.select()
			.from(helpSuggestions)
			.where(
				and(eq(helpSuggestions.workspaceId, workspaceId), eq(helpSuggestions.filePath, filePath))
			)
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
