import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { documents, folders, workspaces } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

type ImportError = { file: string; message: string };

type ImportSummary = {
	createdFolders: number;
	createdDocuments: number;
	skipped: number;
	errors: ImportError[];
};

type FileMetadata = {
	path: string;
	extension: string | null;
	lastModified: number;
};

function extractExtension(filename: string): string | null {
	const lastDot = filename.lastIndexOf(".");
	if (lastDot === -1 || lastDot === filename.length - 1) return null;
	return filename.slice(lastDot + 1).toLowerCase();
}

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
	workspaceId: string,
	name: string,
	parentId: string | null,
	cache: Map<string, string>
): Promise<{ id: string; created: boolean }> {
	const cacheKey = `${workspaceId}|${parentId ?? "root"}|${name}`;
	const cached = cache.get(cacheKey);
	if (cached) return { id: cached, created: false };

	const where = parentId
		? and(
				eq(folders.workspaceId, workspaceId),
				eq(folders.parentId, parentId),
				eq(folders.name, name)
			)
		: and(eq(folders.workspaceId, workspaceId), isNull(folders.parentId), eq(folders.name, name));

	const existing = await db.select().from(folders).where(where).limit(1);
	if (existing[0]) {
		cache.set(cacheKey, existing[0].id);
		return { id: existing[0].id, created: false };
	}

	const [created] = await db
		.insert(folders)
		.values({
			name,
			workspaceId,
			...(parentId ? { parentId } : { parentId: null }),
		})
		.returning({ id: folders.id });

	cache.set(cacheKey, created.id);
	return { id: created.id, created: true };
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

		const [workspace] = await db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);
		if (!workspace) {
			return NextResponse.json<ImportSummary>(
				{
					createdDocuments: 0,
					createdFolders: 0,
					skipped: 0,
					errors: [{ file: "", message: "Workspace not found" }],
				},
				{ status: 404 }
			);
		}

		const formData = await request.formData();
		const fileEntries = formData
			.getAll("files")
			.filter((entry): entry is File => entry instanceof File);

		// Parse metadata if provided
		const metadataJson = formData.get("metadata");
		const metadata: FileMetadata[] = metadataJson ? JSON.parse(metadataJson as string) : [];
		const metadataMap = new Map(metadata.map((m) => [m.path, m]));

		if (!fileEntries.length) {
			return NextResponse.json<ImportSummary>(
				{
					createdDocuments: 0,
					createdFolders: 0,
					skipped: 0,
					errors: [{ file: "", message: "No files provided" }],
				},
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
				const { id, created } = await findOrCreateFolder(
					workspaceId,
					segment,
					parentId,
					folderCache
				);
				parentId = id;
				if (created) createdFolders += 1;
			}

			const content = await file.text();

			// Get metadata from client or extract from filename
			const fileMeta = metadataMap.get(sanitized);
			const extension = fileMeta?.extension ?? extractExtension(filename);
			const originalModifiedAt = fileMeta?.lastModified
				? new Date(fileMeta.lastModified)
				: null;

			try {
				await db.insert(documents).values({
					title: filename,
					content,
					workspaceId,
					folderId: parentId,
					extension,
					originalModifiedAt,
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
			{
				createdDocuments: 0,
				createdFolders: 0,
				skipped: 0,
				errors: [{ file: "", message: "Unexpected server error" }],
			},
			{ status: 500 }
		);
	}
}
