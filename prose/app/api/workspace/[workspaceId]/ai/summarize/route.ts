import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { type ErrorResponse, type SummarizeResponse, summarizeBodySchema } from "@/app/api/schemas";
import AiGenerator from "@/lib/ai/ai-generator";
import { db } from "@/lib/db";
import { documentSummaries } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = await params;
		const body = summarizeBodySchema.parse(await request.json());
		const { documentId, content, promptContent } = body;

		// Call LLM to generate summary
		const generator = new AiGenerator(0.7);
		const summary = await generator.generate(promptContent, content);

		// Upsert summary to database
		const now = new Date();
		const [savedSummary] = await db
			.insert(documentSummaries)
			.values({
				workspaceId,
				documentId,
				summary,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: [documentSummaries.workspaceId, documentSummaries.documentId],
				set: { summary, updatedAt: now },
			})
			.returning();

		return NextResponse.json<SummarizeResponse>({
			summary,
			summaryId: savedSummary.id,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to generate summary:", error);
		return NextResponse.json({ error: "Failed to generate summary" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
