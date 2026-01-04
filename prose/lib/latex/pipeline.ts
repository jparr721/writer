import { randomUUID } from "crypto";
import { mkdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { compilePdf } from "./compile";
import { treeToFileList, writeExportFiles } from "./export-files";
import { fetchWorkspaceTree } from "./fetch-tree";

export type PipelineResult =
	| { success: true; pdf: Buffer }
	| { success: false; error: string; log: string };

function findMainTexDir(files: { relativePath: string }[]): string | null {
	// Find main.tex and return the directory it's in (relative to build root)
	for (const file of files) {
		const normalized = file.relativePath.replace(/\\/g, "/");
		if (normalized === "main.tex") {
			return "";
		}
		if (normalized.endsWith("/main.tex")) {
			return dirname(normalized);
		}
		// Handle Windows path separators
		if (file.relativePath.endsWith("\\main.tex")) {
			return dirname(file.relativePath);
		}
	}

	return null;
}

export async function runCompilationPipeline(workspaceId: string): Promise<PipelineResult> {
	const buildDir = join(tmpdir(), `latex-build-${randomUUID()}`);

	try {
		// 1. Create temp directory
		await mkdir(buildDir, { recursive: true });

		// 2. Fetch workspace tree
		const tree = await fetchWorkspaceTree(workspaceId);
		if (tree.length === 0) {
			return {
				success: false,
				error: "No documents found in workspace",
				log: "",
			};
		}

		// 3. Export files to temp directory
		const files = treeToFileList(tree);
		if (files.length === 0) {
			return {
				success: false,
				error: "No documents to compile",
				log: "",
			};
		}

		// Find main.tex location
		console.log(files.map((f) => f.relativePath).join("\n"));
		const mainTexDir = findMainTexDir(files);
		if (mainTexDir === null) {
			return {
				success: false,
				error: "No main.tex file found. Create a document titled 'main' as the entry point.",
				log: "",
			};
		}

		await writeExportFiles(buildDir, files);

		// 4. Compile from the directory containing main.tex
		const compileDir = mainTexDir ? join(buildDir, mainTexDir) : buildDir;
		const result = await compilePdf(compileDir);

		if (!result.success) {
			return {
				success: false,
				error: result.error,
				log: result.log,
			};
		}

		// 5. Read compiled PDF
		const pdf = await readFile(result.pdfPath);

		return { success: true, pdf };
	} finally {
		// 6. Cleanup temp directory
		await rm(buildDir, { recursive: true, force: true }).catch(() => {
			// Ignore cleanup errors
		});
	}
}
