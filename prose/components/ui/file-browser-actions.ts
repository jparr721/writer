"use server";

import { readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join, sep } from "node:path";

export interface DirectoryListing {
	currentPath: string;
	folders: string[];
	canGoUp: boolean;
}

export async function listDirectory(path?: string): Promise<DirectoryListing> {
	const home = homedir();
	const targetPath = path || home;

	// Security: ensure path is within or equal to home directory
	const normalizedTarget = join(targetPath);
	const normalizedHome = join(home);

	if (!normalizedTarget.startsWith(normalizedHome)) {
		return {
			currentPath: home,
			folders: await getFolders(home),
			canGoUp: false,
		};
	}

	const folders = await getFolders(normalizedTarget);

	return {
		currentPath: normalizedTarget,
		folders,
		canGoUp: normalizedTarget !== normalizedHome,
	};
}

async function getFolders(dirPath: string): Promise<string[]> {
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
			.map((entry) => entry.name)
			.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
	} catch {
		return [];
	}
}

export async function getPathSegments(path: string): Promise<{ name: string; path: string }[]> {
	const home = homedir();
	const normalizedPath = join(path);
	const normalizedHome = join(home);

	if (!normalizedPath.startsWith(normalizedHome)) {
		return [{ name: "~", path: home }];
	}

	const segments: { name: string; path: string }[] = [{ name: "~", path: home }];

	if (normalizedPath === normalizedHome) {
		return segments;
	}

	const relativePath = normalizedPath.slice(normalizedHome.length);
	const parts = relativePath.split(sep).filter(Boolean);

	let currentPath = home;
	for (const part of parts) {
		currentPath = join(currentPath, part);
		segments.push({ name: part, path: currentPath });
	}

	return segments;
}
