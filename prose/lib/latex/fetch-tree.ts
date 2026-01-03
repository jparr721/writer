import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";
import type { DocumentNode, FolderTreeNode } from "./types";

type FolderRow = {
	id: string;
	name: string;
	parentId: string | null;
};

type DocumentRow = {
	id: string;
	title: string;
	content: string;
	folderId: string | null;
};

function buildTree(
	folderRows: FolderRow[],
	documentRows: DocumentRow[]
): FolderTreeNode[] {
	const folderMap = new Map<string, FolderTreeNode>();

	// Create folder nodes
	for (const f of folderRows) {
		folderMap.set(f.id, {
			id: f.id,
			name: f.name,
			parentId: f.parentId,
			folders: [],
			documents: [],
		});
	}

	// Assign documents to folders
	for (const d of documentRows) {
		if (d.folderId) {
			const folder = folderMap.get(d.folderId);
			if (folder) {
				folder.documents.push({
					id: d.id,
					title: d.title,
					content: d.content,
				});
			}
		}
	}

	// Build parent-child relationships
	const roots: FolderTreeNode[] = [];
	for (const folder of folderMap.values()) {
		if (folder.parentId) {
			const parent = folderMap.get(folder.parentId);
			if (parent) {
				parent.folders.push(folder);
			}
		} else {
			roots.push(folder);
		}
	}

	// Collect root-level documents (no folder)
	const rootDocuments: DocumentNode[] = documentRows
		.filter((d) => !d.folderId)
		.map((d) => ({ id: d.id, title: d.title, content: d.content }));

	// If there are root-level documents, create a virtual root or return them separately
	// For now, we'll include them as a virtual "root" folder if they exist
	if (rootDocuments.length > 0 && roots.length === 0) {
		// Create a virtual root containing loose documents
		return [
			{
				id: "root",
				name: "",
				parentId: null,
				folders: [],
				documents: rootDocuments,
			},
		];
	}

	// Attach root-level documents to first root folder if exists, or create virtual root
	if (rootDocuments.length > 0) {
		if (roots.length === 1) {
			roots[0].documents.push(...rootDocuments);
		} else {
			// Multiple roots with loose docs - create container
			roots.unshift({
				id: "root",
				name: "",
				parentId: null,
				folders: [],
				documents: rootDocuments,
			});
		}
	}

	return roots;
}

export async function fetchWorkspaceTree(
	workspaceId: string
): Promise<FolderTreeNode[]> {
	const [folderRows, documentRows] = await Promise.all([
		db.select().from(folders).where(eq(folders.workspaceId, workspaceId)),
		db
			.select({
				id: documents.id,
				title: documents.title,
				content: documents.content,
				folderId: documents.folderId,
			})
			.from(documents)
			.where(eq(documents.workspaceId, workspaceId)),
	]);

	return buildTree(
		folderRows.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId })),
		documentRows
	);
}
