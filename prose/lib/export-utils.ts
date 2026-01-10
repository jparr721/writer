// TODO: Filesystem refactor - Document and Folder types are now filesystem-based
// These are temporary stub types for API compatibility

export type Folder = {
	id: string;
	name: string;
	parentId: string | null;
	workspaceId: string;
};

export type Document = {
	id: string;
	title: string;
	content: string;
	folderId: string | null;
	workspaceId: string;
};

export type FolderWithPath = Folder & { path: string };
export type DocumentWithPath = Document & { path: string };

/**
 * Builds a map of folder IDs to their full paths
 */
export function buildFolderPathMap(folders: Folder[]): Map<string, string> {
	const folderById = new Map<string, Folder>();
	for (const folder of folders) {
		folderById.set(folder.id, folder);
	}

	const pathCache = new Map<string, string>();

	function getPath(folderId: string): string {
		const cached = pathCache.get(folderId);
		if (cached !== undefined) {
			return cached;
		}

		const folder = folderById.get(folderId);
		if (!folder) {
			return "";
		}

		let path: string;
		if (folder.parentId && folderById.has(folder.parentId)) {
			const parentPath = getPath(folder.parentId);
			path = parentPath ? `${parentPath}/${folder.name}` : folder.name;
		} else {
			path = folder.name;
		}

		pathCache.set(folderId, path);
		return path;
	}

	// Build paths for all folders
	for (const folder of folders) {
		getPath(folder.id);
	}

	return pathCache;
}

/**
 * Gets the full path for a document including its filename
 */
export function getDocumentPath(doc: Document, folderPathMap: Map<string, string>): string {
	if (doc.folderId && folderPathMap.has(doc.folderId)) {
		return `${folderPathMap.get(doc.folderId)}/${doc.title}`;
	}
	return doc.title;
}

/**
 * Gets all folder IDs that are descendants of a given folder (including the folder itself)
 */
export function getDescendantFolderIds(folderId: string, folders: Folder[]): Set<string> {
	const childrenMap = new Map<string | null, Folder[]>();
	for (const folder of folders) {
		const parentId = folder.parentId;
		if (!childrenMap.has(parentId)) {
			childrenMap.set(parentId, []);
		}
		childrenMap.get(parentId)?.push(folder);
	}

	const result = new Set<string>();
	const queue = [folderId];

	while (queue.length > 0) {
		const current = queue.shift();
		if (!current) break;
		result.add(current);

		const children = childrenMap.get(current) || [];
		for (const child of children) {
			queue.push(child.id);
		}
	}

	return result;
}

/**
 * Filters documents to only those within a set of folder IDs
 */
export function getDocumentsInFolders(documents: Document[], folderIds: Set<string>): Document[] {
	return documents.filter((doc) => doc.folderId && folderIds.has(doc.folderId));
}

/**
 * Gets all documents with their computed paths for export
 */
export function getDocumentsWithPaths(
	documents: Document[],
	folderPathMap: Map<string, string>
): DocumentWithPath[] {
	return documents.map((doc) => ({
		...doc,
		path: getDocumentPath(doc, folderPathMap),
	}));
}
