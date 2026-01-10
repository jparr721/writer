// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents and folders tables have been removed from the schema

import type { ErrorResponse } from "@/app/api/schemas";

export async function GET() {
	// TODO: Filesystem refactor - implement filesystem-based library export
	return Response.json(
		{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
		{ status: 501 }
	);
}
