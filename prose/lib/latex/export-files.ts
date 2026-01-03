import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import type { ExportedFile, FolderTreeNode } from "./types";

function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_{2,}/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 200);
}

function flattenTree(
	nodes: FolderTreeNode[],
	basePath: string = ""
): ExportedFile[] {
	const files: ExportedFile[] = [];

	for (const node of nodes) {
		const folderPath = node.name ? join(basePath, node.name) : basePath;

		// Add documents in this folder
		for (const doc of node.documents) {
			files.push({
				relativePath: folderPath ? join(folderPath, doc.title) : doc.title,
				content: doc.content,
			});
		}

		// Recurse into subfolders
		if (node.folders.length > 0) {
			files.push(...flattenTree(node.folders, folderPath));
		}
	}

	return files;
}

export function treeToFileList(roots: FolderTreeNode[]): ExportedFile[] {
	return flattenTree(roots);
}

export async function writeExportFiles(
	buildDir: string,
	files: ExportedFile[]
): Promise<void> {
	const createdDirs = new Set<string>();

	for (const file of files) {
		const fullPath = join(buildDir, file.relativePath);
		const dir = dirname(fullPath);

		if (!createdDirs.has(dir)) {
			await mkdir(dir, { recursive: true });
			createdDirs.add(dir);
		}

		await writeFile(fullPath, file.content, "utf-8");
	}
}
