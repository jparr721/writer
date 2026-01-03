export type FolderTreeNode = {
	id: string;
	name: string;
	parentId: string | null;
	folders: FolderTreeNode[];
	documents: DocumentNode[];
};

export type DocumentNode = {
	id: string;
	title: string;
	content: string;
};

export type ExportedFile = {
	relativePath: string;
	content: string;
};

export type CompilationResult =
	| { success: true; pdfPath: string; log: string }
	| { success: false; error: string; log: string };
