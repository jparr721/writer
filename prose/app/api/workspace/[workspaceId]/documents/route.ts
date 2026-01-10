// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents table has been removed from the schema

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	createDocumentBodySchema,
	type ErrorResponse,
} from "@/app/api/schemas";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		workspaceParamsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based document listing
		return NextResponse.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		console.error("Failed to fetch documents:", error);
		return NextResponse.json({ error: "Failed to fetch documents" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		workspaceParamsSchema.parse(await params);
		createDocumentBodySchema.parse(await request.json());

		// TODO: Filesystem refactor - implement filesystem-based document creation
		return NextResponse.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request body" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to create document:", error);
		return NextResponse.json({ error: "Failed to create document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
