// TODO: Filesystem refactor - this endpoint needs to be reimplemented
// The documents and folders tables have been removed from the schema

import { NextResponse } from "next/server";

type LibraryFolder = {
	id: string;
	name: string;
	parentId: string | null;
};

type LibraryDocument = {
	id: string;
	title: string;
	folderId: string | null;
	updatedAt: Date | null;
};

type LibraryResponse = {
	folders: LibraryFolder[];
	documents: LibraryDocument[];
};

export async function GET() {
	// TODO: Filesystem refactor - implement filesystem-based library fetching
	return NextResponse.json(
		{ error: "Not implemented - filesystem refactor pending" },
		{ status: 501 }
	);
}
