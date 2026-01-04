import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { type ErrorResponse, type HelperResponse, helperBodySchema } from "@/app/api/schemas";
import AiGenerator from "@/lib/ai/ai-generator";
import { db } from "@/lib/db";
import { helpSuggestions } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId } = await params;
		const body = helperBodySchema.parse(await request.json());
		const { documentId, content, bookContext, specificRequests, promptContent } = body;

		// Replace template variables in prompt
		const processedPrompt = promptContent
			.replace("{{book_context}}", bookContext ?? "No book context provided.")
			.replace("{{chapter}}", content)
			.replace("{{specific_requests}}", specificRequests ?? "No specific requests.");

		// Call LLM
		const generator = new AiGenerator(0.7);
		const responseText = await generator.generate(
			"You are a helpful writing assistant.",
			processedPrompt
		);

		// Store the suggestion
		const [suggestion] = await db
			.insert(helpSuggestions)
			.values({
				workspaceId,
				documentId,
				prompt: specificRequests ?? "",
				response: responseText,
			})
			.returning();

		return NextResponse.json<HelperResponse>({
			suggestionId: suggestion.id,
			response: responseText,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to run helper:", error);
		return NextResponse.json({ error: "Failed to run helper" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
