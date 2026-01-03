import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";

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
	try {
		const [folderRows, documentRows] = await Promise.all([
			db.select().from(folders),
			db
				.select({
					id: documents.id,
					title: documents.title,
					folderId: documents.folderId,
					updatedAt: documents.updatedAt,
				})
				.from(documents)
				.orderBy(desc(documents.updatedAt)),
		]);

		return NextResponse.json<LibraryResponse>({
			folders: folderRows.map((f) => ({
				id: f.id,
				name: f.name,
				parentId: f.parentId,
			})),
			documents: documentRows,
		});
	} catch (error) {
		console.error("Failed to fetch library", error);
		return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
	}
}

