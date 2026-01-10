// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents table has been removed from the schema

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type DocumentIdParams,
	documentIdParamsSchema,
	type ErrorResponse,
} from "@/app/api/schemas";

type RouteParams = { params: Promise<DocumentIdParams> };

export async function POST(_request: Request, { params }: RouteParams) {
	try {
		documentIdParamsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based document export
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

		console.error("Failed to export document:", error);
		return NextResponse.json({ error: "Failed to export document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
