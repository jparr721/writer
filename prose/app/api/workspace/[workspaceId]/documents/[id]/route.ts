// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents table has been removed from the schema

import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	type DocumentIdParams,
	type ErrorResponse,
	updateDocumentBodySchema,
} from "@/app/api/schemas";

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.uuid(),
});

type RouteParams = { params: Promise<DocumentIdParams & { workspaceId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		paramsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based document fetch
		return NextResponse.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch document:", error);
		return NextResponse.json({ error: "Failed to fetch document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	try {
		paramsSchema.parse(await params);
		updateDocumentBodySchema.parse(await request.json());

		// TODO: Filesystem refactor - implement filesystem-based document update
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

		console.error("Failed to update document:", error);
		return NextResponse.json({ error: "Failed to update document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		paramsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based document delete
		return NextResponse.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to delete document", error);
		return NextResponse.json({ error: "Failed to delete document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
