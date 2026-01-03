import archiver from "archiver";
import { PassThrough } from "node:stream";
import type { ErrorResponse } from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents, folders } from "@/lib/db/schema";
import { buildFolderPathMap, getDocumentPath } from "@/lib/export-utils";

export async function GET() {
	try {
		// Fetch all folders and documents
		const [allFolders, allDocuments] = await Promise.all([
			db.select().from(folders),
			db.select().from(documents),
		]);

		// Build path map for all folders
		const folderPathMap = buildFolderPathMap(allFolders);

		// Create archive
		const archive = archiver("zip", { zlib: { level: 9 } });
		const passthrough = new PassThrough();

		archive.pipe(passthrough);

		// Add all documents to archive
		for (const doc of allDocuments) {
			const path = getDocumentPath(doc, folderPathMap);
			archive.append(doc.content, { name: path });
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

		return new Response(readableStream, {
			headers: {
				"Content-Type": "application/zip",
				"Content-Disposition": 'attachment; filename="library.zip"',
			},
		});
	} catch (error) {
		console.error("Failed to export library:", error);
		return Response.json({ error: "Failed to export library" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
