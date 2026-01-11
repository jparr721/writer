import { readFile, readdir, stat, writeFile, mkdir } from "fs/promises";
import { basename, dirname, join, relative } from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { createDocumentBodySchema, type ErrorResponse } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

type DocumentResponse = {
	id: string;
	title: string;
	content: string;
};

async function collectTexFiles(
	dirPath: string,
	rootPath: string
): Promise<DocumentResponse[]> {
	const documents: DocumentResponse[] = [];

	try {
		const entries = await readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.name.startsWith(".")) continue;

			const fullPath = join(dirPath, entry.name);

			if (entry.isDirectory()) {
				const subDocs = await collectTexFiles(fullPath, rootPath);
				documents.push(...subDocs);
			} else if (entry.name.endsWith(".tex")) {
				try {
					const content = await readFile(fullPath, "utf-8");
					const relativePath = relative(rootPath, fullPath);
					documents.push({
						id: relativePath,
						title: basename(entry.name, ".tex"),
						content,
					});
				} catch {
					// Skip files that can't be read
				}
			}
		}
	} catch {
		// Skip directories that can't be read
	}

	return documents;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

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

		const documents = await collectTexFiles(workspace.rootPath, workspace.rootPath);
		return NextResponse.json(documents);
	} catch (error) {
		console.error("Failed to fetch documents:", error);
		return NextResponse.json({ error: "Failed to fetch documents" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);
		const body = createDocumentBodySchema.parse(await request.json());

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

		// Create the file path from title
		if (!body.title) {
			return NextResponse.json({ error: "Title is required" } satisfies ErrorResponse, {
				status: 400,
			});
		}
		const fileName = body.title.endsWith(".tex") ? body.title : `${body.title}.tex`;
		const fullPath = join(workspace.rootPath, fileName);

		// Ensure parent directory exists
		await mkdir(dirname(fullPath), { recursive: true });

		// Check if file already exists
		try {
			await stat(fullPath);
			return NextResponse.json({ error: "Document already exists" } satisfies ErrorResponse, {
				status: 409,
			});
		} catch {
			// File doesn't exist, which is what we want
		}

		// Write the file
		await writeFile(fullPath, body.content || "", "utf-8");

		const relativePath = relative(workspace.rootPath, fullPath);
		return NextResponse.json<DocumentResponse>({
			id: relativePath,
			title: basename(fileName, ".tex"),
			content: body.content || "",
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request body" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to create document:", error);
		return NextResponse.json({ error: "Failed to create document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
