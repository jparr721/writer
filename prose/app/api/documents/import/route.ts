import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";

type ImportError = { file: string; message: string };

type ImportSummary = {
	createdFolders: number;
	createdDocuments: number;
	skipped: number;
	errors: ImportError[];
};

function sanitizePath(path: string): string | null {
	// Reject backslashes and absolute/parent traversal
	if (!path || path.includes("\\") || path.startsWith("/") || path.includes("..")) {
		return null;
	}

	const parts = path.split("/").filter((segment) => segment.length > 0);
	if (!parts.length) return null;

	return parts.join("/");
}

async function findOrCreateFolder(
	name: string,
	parentId: string | null,
	cache: Map<string, string>
): Promise<{ id: string; created: boolean }> {
	const cacheKey = `${parentId ?? "root"}|${name}`;
	const cached = cache.get(cacheKey);
	if (cached) return { id: cached, created: false };

	const where = parentId
		? and(eq(folders.parentId, parentId), eq(folders.name, name))
		: and(isNull(folders.parentId), eq(folders.name, name));

	const existing = await db.select().from(folders).where(where).limit(1);
	if (existing[0]) {
		cache.set(cacheKey, existing[0].id);
		return { id: existing[0].id, created: false };
	}

	const [created] = await db
		.insert(folders)
		.values({
			name,
			...(parentId ? { parentId } : { parentId: null }),
		})
		.returning({ id: folders.id });

	cache.set(cacheKey, created.id);
	return { id: created.id, created: true };
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const fileEntries = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

		if (!fileEntries.length) {
			return NextResponse.json<ImportSummary>(
				{ createdDocuments: 0, createdFolders: 0, skipped: 0, errors: [{ file: "", message: "No files provided" }] },
				{ status: 400 }
			);
		}

		const folderCache = new Map<string, string>();
		const seenPaths = new Set<string>();
		let createdFolders = 0;
		let createdDocuments = 0;
		let skipped = 0;
		const errors: ImportError[] = [];

		for (const file of fileEntries) {
			const sanitized = sanitizePath(file.name);
			if (!sanitized) {
				errors.push({ file: file.name, message: "Invalid path" });
				skipped += 1;
				continue;
			}

			if (seenPaths.has(sanitized)) {
				skipped += 1;
				continue;
			}
			seenPaths.add(sanitized);

			const segments = sanitized.split("/");
			const filename = segments.pop();
			if (!filename) {
				errors.push({ file: sanitized, message: "Missing filename" });
				skipped += 1;
				continue;
			}

			let parentId: string | null = null;
			for (const segment of segments) {
				const { id, created } = await findOrCreateFolder(segment, parentId, folderCache);
				parentId = id;
				if (created) createdFolders += 1;
			}

			const content = await file.text();

			try {
				await db.insert(documents).values({
					title: filename,
					content,
					folderId: parentId,
				});
				createdDocuments += 1;
			} catch (error) {
				console.error("Failed to insert document", error);
				errors.push({ file: sanitized, message: "Failed to save document" });
				skipped += 1;
			}
		}

		return NextResponse.json<ImportSummary>({
			createdDocuments,
			createdFolders,
			skipped,
			errors,
		});
	} catch (error) {
		console.error("Failed to import documents", error);
		return NextResponse.json<ImportSummary>(
			{ createdDocuments: 0, createdFolders: 0, skipped: 0, errors: [{ file: "", message: "Unexpected server error" }] },
			{ status: 500 }
		);
	}
}

