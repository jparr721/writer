import { readdir, stat } from "fs/promises";
import { basename, dirname, join, relative } from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

type LibraryFolder = {
	id: string;
	name: string;
	parentId: string | null;
};

type LibraryDocument = {
	id: string;
	title: string;
	folderId: string | null;
	updatedAt: string | null;
};

type LibraryResponse = {
	folders: LibraryFolder[];
	documents: LibraryDocument[];
};

async function scanDirectory(
	rootPath: string,
	currentPath: string,
	folders: LibraryFolder[],
	documents: LibraryDocument[]
): Promise<void> {
	const entries = await readdir(currentPath, { withFileTypes: true });

	for (const entry of entries) {
		// Skip hidden files and directories
		if (entry.name.startsWith(".")) continue;

		const fullPath = join(currentPath, entry.name);
		const relativePath = relative(rootPath, fullPath);

		if (entry.isDirectory()) {
			// Calculate parent folder ID (relative path of parent directory)
			const parentRelPath = relative(rootPath, currentPath);
			const parentId = parentRelPath === "" ? null : parentRelPath;

			folders.push({
				id: relativePath,
				name: entry.name,
				parentId,
			});

			// Recursively scan subdirectory
			await scanDirectory(rootPath, fullPath, folders, documents);
		} else if (entry.isFile() && entry.name.endsWith(".tex")) {
			// Get file stats for updatedAt
			const fileStat = await stat(fullPath);

			// Calculate folder ID (relative path of parent directory)
			const parentRelPath = relative(rootPath, dirname(fullPath));
			const folderId = parentRelPath === "" ? null : parentRelPath;

			// Use filename without extension as title
			const title = basename(entry.name, ".tex");

			documents.push({
				id: relativePath,
				title,
				folderId,
				updatedAt: fileStat.mtime.toISOString(),
			});
		}
	}
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

		// Fetch workspace to get rootPath
		const [workspace] = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);

		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
		}

		const folders: LibraryFolder[] = [];
		const documents: LibraryDocument[] = [];

		// Scan the workspace filesystem
		try {
			await scanDirectory(workspace.rootPath, workspace.rootPath, folders, documents);
		} catch (fsError) {
			// Handle filesystem errors (e.g., directory doesn't exist)
			console.error("Failed to scan workspace directory:", fsError);
			return NextResponse.json(
				{ error: "Failed to read workspace directory" },
				{ status: 500 }
			);
		}

		return NextResponse.json<LibraryResponse>({ folders, documents });
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: "Invalid workspace ID" }, { status: 400 });
		}

		console.error("Failed to fetch workspace library", error);
		return NextResponse.json({ error: "Failed to fetch library" }, { status: 500 });
	}
}
