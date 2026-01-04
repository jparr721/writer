import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	documentIdParamsSchema,
	type ErrorResponse,
	type HelpSuggestionListResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { helpSuggestions } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

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
