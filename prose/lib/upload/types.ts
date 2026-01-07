export type PendingFile = {
	file: File;
	path: string;
	size: number;
	extension: string | null;
	lastModified: number;
};

export type FileMetadata = {
	path: string;
	extension: string | null;
	lastModified: number;
};

export type UploadProgress = {
	loaded: number;
	total: number;
	completed: number; // 0-100
};

export type ImportSummary = {
	createdFolders: number;
	createdDocuments: number;
	skipped: number;
	errors: Array<{ file: string; message: string }>;
};
