import { mkdir, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

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

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);

		const [workspace] = await db
			.select()
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
		const files = formData.getAll("files");

		const summary: ImportSummary = {
			createdDocuments: 0,
			createdFolders: 0,
			skipped: 0,
			errors: [],
		};

		const createdDirs = new Set<string>();

		for (const file of files) {
			if (!(file instanceof File)) {
				continue;
			}

			// Get the relative path from the file (webkitRelativePath or name)
			const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;

			// Only process .tex files
			if (!relativePath.endsWith(".tex")) {
				summary.skipped++;
				continue;
			}

			const fullPath = join(workspace.rootPath, relativePath);
			const parentDir = dirname(fullPath);

			try {
				// Check if file already exists
				try {
					await stat(fullPath);
					summary.skipped++;
					continue; // Skip existing files
				} catch {
					// File doesn't exist, proceed with creation
				}

				// Create parent directory if needed
				if (!createdDirs.has(parentDir)) {
					await mkdir(parentDir, { recursive: true });
					// Count unique directories created (excluding workspace root)
					const relativeDirPath = dirname(relativePath);
					if (relativeDirPath !== ".") {
						const dirParts = relativeDirPath.split(/[\\/]/);
						for (let i = 1; i <= dirParts.length; i++) {
							const partialPath = dirParts.slice(0, i).join("/");
							if (!createdDirs.has(partialPath)) {
								createdDirs.add(partialPath);
								summary.createdFolders++;
							}
						}
					}
					createdDirs.add(parentDir);
				}

				// Write the file
				const content = await file.text();
				await writeFile(fullPath, content, "utf-8");
				summary.createdDocuments++;
			} catch (error) {
				summary.errors.push({
					file: relativePath,
					message: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		return NextResponse.json<ImportSummary>(summary);
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
