import type { PendingFile, FileMetadata } from "./types";

export function getRelativePath(file: File): string {
	const maybeWithPath = file as File & { webkitRelativePath?: string };
	const relPath = maybeWithPath.webkitRelativePath;
	return relPath && relPath.length > 0 ? relPath : file.name;
}

export function extractExtension(filename: string): string | null {
	const lastDot = filename.lastIndexOf(".");
	if (lastDot === -1 || lastDot === filename.length - 1) return null;
	return filename.slice(lastDot + 1).toLowerCase();
}

export function fileToPendingFile(file: File): PendingFile {
	const path = getRelativePath(file);
	const filename = path.split("/").pop() || path;
	return {
		file,
		path,
		size: file.size,
		extension: extractExtension(filename),
		lastModified: file.lastModified,
	};
}

export function pendingFilesToMetadata(files: PendingFile[]): FileMetadata[] {
	return files.map((f) => ({
		path: f.path,
		extension: f.extension,
		lastModified: f.lastModified,
	}));
}

export function buildFormData(files: PendingFile[]): FormData {
	const formData = new FormData();

	for (const item of files) {
		formData.append("files", item.file, item.path);
	}

	formData.append("metadata", JSON.stringify(pendingFilesToMetadata(files)));

	return formData;
}
