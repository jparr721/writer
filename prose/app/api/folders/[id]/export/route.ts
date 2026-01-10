// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents and folders tables have been removed from the schema

import { ZodError } from "zod";
import { type ErrorResponse, type FolderIdParams, folderIdParamsSchema } from "@/app/api/schemas";

type RouteParams = { params: Promise<FolderIdParams> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		folderIdParamsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based folder export
		return Response.json(
			{ error: "Not implemented - filesystem refactor pending" } satisfies ErrorResponse,
			{ status: 501 }
		);
	} catch (error) {
		if (error instanceof ZodError) {
			return Response.json({ error: "Invalid folder id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to export folder:", error);
		return Response.json({ error: "Failed to export folder" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
