import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type EditorPassResponse,
	type ErrorResponse,
	editorPassBodySchema,
} from "@/app/api/schemas";
import AiGenerator from "@/lib/ai/ai-generator";
import { db } from "@/lib/db";
import { documentDrafts } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = await params;
		const body = editorPassBodySchema.parse(await request.json());
		const { filePath, content, promptContent } = body;

		// Call LLM
		const generator = new AiGenerator(0.7);
		const editedContent = await generator.generate(promptContent, content);

		// Upsert to draft
		const now = new Date();
		const [draft] = await db
			.insert(documentDrafts)
			.values({
				workspaceId,
				filePath,
				content: editedContent,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentDrafts.workspaceId, documentDrafts.filePath],
				set: { content: editedContent, updatedAt: now },
			})
			.returning();

		return NextResponse.json<EditorPassResponse>({
			editedContent,
			draftId: draft.id,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to run editor pass:", error);
		return NextResponse.json({ error: "Failed to run editor pass" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
