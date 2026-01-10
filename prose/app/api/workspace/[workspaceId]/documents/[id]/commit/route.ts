// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents table has been removed from the schema
// Commit now means writing draft content to filesystem

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	commitDocumentBodySchema,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
	try {
		documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);
		commitDocumentBodySchema.parse(await request.json());

		// TODO: Filesystem refactor - implement filesystem-based document commit
		// This should write draft content to the file and clear the draft
		return NextResponse.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to commit document draft:", error);
		return NextResponse.json({ error: "Failed to commit document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
