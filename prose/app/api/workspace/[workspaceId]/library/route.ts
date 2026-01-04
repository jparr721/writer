import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

		const [folderRows, documentRows] = await Promise.all([
			db.select().from(folders).where(eq(folders.workspaceId, workspaceId)),
			db
				.select({
					id: documents.id,
					title: documents.title,
					folderId: documents.folderId,
					updatedAt: documents.updatedAt,
				})
				.from(documents)
				.where(eq(documents.workspaceId, workspaceId))
				.orderBy(desc(documents.updatedAt)),
		]);

		return NextResponse.json({
			folders: folderRows.map((f) => ({
				id: f.id,
				name: f.name,
				parentId: f.parentId,
			})),
			documents: documentRows,
		});
	} catch (error) {
		console.error("Failed to fetch workspace library", error);
		return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
	}
}
