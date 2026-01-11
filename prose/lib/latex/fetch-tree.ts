import { readFile, readdir, stat } from "fs/promises";
import { basename, join, relative } from "path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import type { DocumentNode, FolderTreeNode } from "./types";

async function readDirectoryRecursive(
	dirPath: string,
	rootPath: string,
	parentId: string | null
): Promise<FolderTreeNode> {
	const dirName = basename(dirPath);
	const relativePath = relative(rootPath, dirPath);
	const folderId = relativePath || "root";

	const entries = await readdir(dirPath, { withFileTypes: true });

	const folders: FolderTreeNode[] = [];
	const documents: DocumentNode[] = [];

	for (const entry of entries) {
		// Skip hidden files/folders
		if (entry.name.startsWith(".")) continue;

		const fullPath = join(dirPath, entry.name);

		if (entry.isDirectory()) {
			const subfolder = await readDirectoryRecursive(fullPath, rootPath, folderId);
			folders.push(subfolder);
		} else if (entry.name.endsWith(".tex")) {
			try {
				const content = await readFile(fullPath, "utf-8");
				const docRelativePath = relative(rootPath, fullPath);
				documents.push({
					id: docRelativePath,
					title: basename(entry.name, ".tex"),
					content,
				});
			} catch {
				// Skip files that can't be read
			}
		}
	}

	// Sort folders and documents alphabetically
	folders.sort((a, b) => a.name.localeCompare(b.name));
	documents.sort((a, b) => a.title.localeCompare(b.title));

	return {
		id: folderId,
		name: dirName,
		parentId,
		folders,
		documents,
	};
}

export async function fetchWorkspaceTree(workspaceId: string): Promise<FolderTreeNode[]> {
	// Fetch workspace to get rootPath
	const [workspace] = await db
		.select()
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);

	if (!workspace) {
		console.error(`Workspace not found: ${workspaceId}`);
		return [];
	}

	try {
		// Check if rootPath exists
		const rootStat = await stat(workspace.rootPath);
		if (!rootStat.isDirectory()) {
			console.error(`Workspace rootPath is not a directory: ${workspace.rootPath}`);
			return [];
		}

		// Build tree from filesystem
		const tree = await readDirectoryRecursive(workspace.rootPath, workspace.rootPath, null);

		// Return as array (the root folder contains everything)
		return [tree];
	} catch (error) {
		console.error(`Failed to read workspace directory: ${workspace.rootPath}`, error);
		return [];
	}
}
