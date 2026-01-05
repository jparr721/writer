import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type ErrorResponse,
	type RewriterResponse,
	rewriterBodySchema,
} from "@/app/api/schemas";
import AiGenerator from "@/lib/ai/ai-generator";

export async function POST(request: Request) {
	try {
		const body = rewriterBodySchema.parse(await request.json());
		const { selectedText, instructions, bookContext, promptContent, currentChapter } = body;

		// Replace template variables in prompt
		const filledPrompt = promptContent
			.replace("{{book_context}}", bookContext)
			.replace("{{selected_text}}", selectedText)
			.replace("{{instructions}}", instructions)
			.replace("{{current_chapter}}", currentChapter);

		// Call LLM with temperature 0.7 for creative rewriting
		const generator = new AiGenerator(0.7);
		const rewrittenText = await generator.generate(filledPrompt, selectedText);

		return NextResponse.json<RewriterResponse>({
			rewrittenText: rewrittenText.trim(),
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json(
				{ error: "Invalid request" } satisfies ErrorResponse,
				{
					status: 400,
				},
			);
		}

		console.error("Failed to run rewriter:", error);
		return NextResponse.json(
			{ error: "Failed to run rewriter" } satisfies ErrorResponse,
			{
				status: 500,
			},
		);
	}
}
