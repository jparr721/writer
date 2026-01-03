// Utility to select a folder via the File System Access API and upload files to the backend
// Files are posted to /api/documents with filename -> title, content -> file text

import axios from "axios";

type FileSystemFileHandle = {
	kind: "file";
	name: string;
	getFile: () => Promise<File>;
};

type FileSystemDirectoryHandle = {
	kind: "directory";
	name: string;
	values: () => AsyncIterable<FileSystemFileHandle | FileSystemDirectoryHandle>;
};

declare global {
	interface Window {
		showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
	}
}

export type UploadFolderResult = {
	uploaded: number;
	skipped: number;
	errors: Array<{ file: string; message: string }>;
};

async function collectFiles(directory: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> {
	const files: FileSystemFileHandle[] = [];

	for await (const entry of directory.values()) {
		if (entry.kind === "file") {
			files.push(entry);
		}
	}

	return files;
}

export async function uploadFolder(): Promise<UploadFolderResult> {
	if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
		throw new Error("Folder selection is not supported in this browser.");
	}

	try {
		const directory = await window.showDirectoryPicker();
		console.log(directory)
	} catch (error) {
		console.error(error);
		return { uploaded: 0, skipped: 0, errors: [] };
	}
	const files = await collectFiles(directory);

	// let uploaded = 0;
	// let skipped = 0;
	// const errors: UploadFolderResult["errors"] = [];

	// for (const handle of files) {
	// 	try {
	// 		const file = await handle.getFile();
	// 		const content = await file.text();
	// 		const title = file.name;

	// 		await axios.post("/api/documents", { title, content });

	// 		uploaded += 1;
	// 	} catch (error) {
	// 		const message = error instanceof Error ? error.message : "Unknown error";
	// 		errors.push({ file: handle.name, message });
	// 		skipped += 1;
	// 	}
	// }

	return { uploaded, skipped, errors };
}
