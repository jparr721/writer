import { readFile, writeFile } from "fs/promises";
import { basename, join } from "path";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { commitDocumentBodySchema, type ErrorResponse } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documentDrafts, workspaces } from "@/lib/db/schema";

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.string(), // URL-encoded file path
});

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

type DocumentResponse = {
	id: string;
	title: string;
	content: string;
};

export async function POST(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);
		const body = commitDocumentBodySchema.parse(await request.json());

		// Fetch workspace to get rootPath
		const [workspace] = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);

		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const fullPath = join(workspace.rootPath, filePath);

		// Write the content to the file
		await writeFile(fullPath, body.content, "utf-8");

		// Delete the draft since we've committed
		await db
			.delete(documentDrafts)
			.where(
				and(eq(documentDrafts.workspaceId, workspaceId), eq(documentDrafts.filePath, filePath))
			);

		// Read back and return the document
		const content = await readFile(fullPath, "utf-8");
		const title = basename(filePath, ".tex");

		return NextResponse.json<DocumentResponse>({
			id: filePath,
			title,
			content,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to commit document draft:", error);
		return NextResponse.json({ error: "Failed to commit document draft" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
