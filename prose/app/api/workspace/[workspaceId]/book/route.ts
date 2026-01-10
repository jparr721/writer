import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { BookFileResponse, BookResponse, ErrorResponse } from "@/app/api/schemas";
import { createBookBodySchema } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { bookFiles } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
): Promise<NextResponse<BookResponse | ErrorResponse>> {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

		const rows = await db
			.select({
				id: bookFiles.id,
				filePath: bookFiles.filePath,
				nodeType: bookFiles.nodeType,
				position: bookFiles.position,
			})
			.from(bookFiles)
			.where(eq(bookFiles.workspaceId, workspaceId))
			.orderBy(asc(bookFiles.position));

		return NextResponse.json({
			files: rows as BookFileResponse[],
		});
	} catch (error) {
		console.error("Failed to fetch book structure", error);
		return NextResponse.json({ error: "Failed to fetch book structure" }, { status: 500 });
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
): Promise<NextResponse<BookResponse | ErrorResponse>> {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);
		const body = createBookBodySchema.parse(await request.json());

		// Delete existing book files and insert new ones in a transaction
		await db.transaction(async (tx) => {
			await tx.delete(bookFiles).where(eq(bookFiles.workspaceId, workspaceId));

			if (body.files.length > 0) {
				await tx.insert(bookFiles).values(
					body.files.map((file) => ({
						workspaceId,
						filePath: file.filePath,
						nodeType: file.nodeType,
						position: file.position,
					}))
				);
			}
		});

		// Fetch the newly created book structure
		const rows = await db
			.select({
				id: bookFiles.id,
				filePath: bookFiles.filePath,
				nodeType: bookFiles.nodeType,
				position: bookFiles.position,
			})
			.from(bookFiles)
			.where(eq(bookFiles.workspaceId, workspaceId))
			.orderBy(asc(bookFiles.position));

		return NextResponse.json({
			files: rows as BookFileResponse[],
		});
	} catch (error) {
		console.error("Failed to create book structure", error);
		return NextResponse.json({ error: "Failed to create book structure" }, { status: 500 });
	}
}
