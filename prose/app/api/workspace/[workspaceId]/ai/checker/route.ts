import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type CheckerResponse,
	type ConsistencyCheckItem,
	checkerBodySchema,
	consistencyCheckItemSchema,
	type ErrorResponse,
} from "@/app/api/schemas";
import AiGenerator from "@/lib/ai/ai-generator";
import { db } from "@/lib/db";
import { consistencyChecks, documentDrafts, documents, workspaces } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

function parseCheckerResponse(response: string): ConsistencyCheckItem[] {
	// Try to extract JSON array from response
	const jsonMatch = response.match(/\[[\s\S]*\]/);
	if (!jsonMatch) return [];

	try {
		const parsed = JSON.parse(jsonMatch[0]);
		return consistencyCheckItemSchema.array().parse(parsed);
	} catch {
		console.error("Failed to parse checker response");
		return [];
	}
}

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = await params;
		const body = checkerBodySchema.parse(await request.json());
		const { documentId, content, promptContent } = body;

		// Validate workspace
		const [workspace] = await db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);

		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		// Validate document
		const [document] = await db
			.select({ id: documents.id })
			.from(documents)
			.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
			.limit(1);

		if (!document) {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		// Ensure we have a draft to attach checks to
		const now = new Date();
		const [draft] = await db
			.insert(documentDrafts)
			.values({
				workspaceId,
				documentId,
				content,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentDrafts.workspaceId, documentDrafts.documentId],
				set: { content, updatedAt: now },
			})
			.returning();

		// Call LLM
		const generator = new AiGenerator(0);
		const responseText = await generator.generate(promptContent, content);

		const checks = parseCheckerResponse(responseText);

		// Clear existing checks for this document
		await db
			.delete(consistencyChecks)
			.where(
				and(
					eq(consistencyChecks.workspaceId, workspaceId),
					eq(consistencyChecks.documentId, documentId)
				)
			);

		// Store new checks
		if (checks.length > 0) {
			await db.insert(consistencyChecks).values(
				checks.map((check) => ({
					workspaceId,
					documentId,
					draftId: draft.id,
					line: check.line,
					original: check.original,
					fixed: check.fixed,
					type: check.type,
				}))
			);
		}

		return NextResponse.json<CheckerResponse>({
			checks,
			draftId: draft.id,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to run checker:", error);
		return NextResponse.json({ error: "Failed to run checker" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
