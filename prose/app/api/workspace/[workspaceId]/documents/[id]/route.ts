import { readFile, stat, unlink, writeFile } from "fs/promises";
import { basename, join } from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { type ErrorResponse, updateDocumentBodySchema } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

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

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

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

		// Read file content
		try {
			const content = await readFile(fullPath, "utf-8");
			const title = basename(filePath, ".tex");

			return NextResponse.json<DocumentResponse>({
				id: filePath,
				title,
				content,
			});
		} catch (fsError) {
			console.error("Failed to read document file:", fsError);
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}
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
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);
		const body = updateDocumentBodySchema.parse(await request.json());

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

		// Check if file exists
		try {
			await stat(fullPath);
		} catch {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		// Write updated content if provided
		if (body.content !== undefined) {
			await writeFile(fullPath, body.content, "utf-8");
		}

		// Read back the file to return updated document
		const content = await readFile(fullPath, "utf-8");
		const title = body.title ?? basename(filePath, ".tex");

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

		console.error("Failed to update document:", error);
		return NextResponse.json({ error: "Failed to update document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

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

		// Delete the file
		try {
			await unlink(fullPath);
			return NextResponse.json({ success: true });
		} catch (fsError) {
			console.error("Failed to delete document file:", fsError);
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}
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
