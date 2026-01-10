// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents and folders tables have been removed from the schema

import { NextResponse } from "next/server";
import { z } from "zod";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

type ImportError = { file: string; message: string };

type ImportSummary = {
	createdFolders: number;
	createdDocuments: number;
	skipped: number;
	errors: ImportError[];
};

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		workspaceParamsSchema.parse(await params);

		// TODO: Filesystem refactor - implement filesystem-based document import
		return NextResponse.json<ImportSummary>(
			{
				createdDocuments: 0,
				createdFolders: 0,
				skipped: 0,
				errors: [{ file: "", message: "Not implemented - filesystem refactor pending" }],
			},
			{ status: 501 }
		);
	} catch (error) {
		console.error("Failed to import documents", error);
		return NextResponse.json<ImportSummary>(
			{
				createdDocuments: 0,
				createdFolders: 0,
				skipped: 0,
				errors: [{ file: "", message: "Unexpected server error" }],
			},
			{ status: 500 }
		);
	}
}
