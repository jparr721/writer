import { PassThrough } from "node:stream";
import archiver from "archiver";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { type ErrorResponse, type FolderIdParams, folderIdParamsSchema } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";
import {
	buildFolderPathMap,
	getDescendantFolderIds,
	getDocumentPath,
	getDocumentsInFolders,
} from "@/lib/export-utils";

type RouteParams = { params: Promise<FolderIdParams> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { id } = folderIdParamsSchema.parse(await params);

		// Fetch the target folder
		const [targetFolder] = await db.select().from(folders).where(eq(folders.id, id));

		if (!targetFolder) {
			return Response.json({ error: "Folder not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		// Fetch all folders and documents
		const [allFolders, allDocuments] = await Promise.all([
			db.select().from(folders),
			db.select().from(documents),
		]);

		// Get all descendant folder IDs (including the target folder)
		const descendantIds = getDescendantFolderIds(id, allFolders);

		// Build path map for all folders
		const folderPathMap = buildFolderPathMap(allFolders);

		// Get the base path of the target folder (we'll strip this from exported paths)
		const basePath = folderPathMap.get(id) || targetFolder.name;

		// Filter documents to only those in descendant folders
		const documentsToExport = getDocumentsInFolders(allDocuments, descendantIds);

		// Create archive
		const archive = archiver("zip", { zlib: { level: 9 } });
		const passthrough = new PassThrough();

		archive.pipe(passthrough);

		// Add documents to archive
		for (const doc of documentsToExport) {
			const fullPath = getDocumentPath(doc, folderPathMap);
			// Make the path relative to the target folder
			const relativePath = fullPath.startsWith(basePath + "/")
				? fullPath.slice(basePath.length + 1)
				: fullPath.startsWith(basePath)
					? fullPath.slice(basePath.length) || doc.title
					: fullPath;

			archive.append(doc.content, { name: relativePath });
		}

		archive.finalize();

		// Convert PassThrough to ReadableStream for Response
		const readableStream = new ReadableStream({
			start(controller) {
				passthrough.on("data", (chunk) => {
					controller.enqueue(chunk);
				});
				passthrough.on("end", () => {
					controller.close();
				});
				passthrough.on("error", (err) => {
					controller.error(err);
				});
			},
		});

		const sanitizedName = targetFolder.name.replace(/[^a-zA-Z0-9-_]/g, "_");

		return new Response(readableStream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": `attachment; filename="${sanitizedName}.zip"`,
			},
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return Response.json({ error: "Invalid folder id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to export folder:", error);
		return Response.json({ error: "Failed to export folder" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
