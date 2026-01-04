import { spawn } from "child_process";
import { join } from "path";
import type { CompilationResult } from "./types";

const COMPILE_TIMEOUT_MS = 60000;

export function compilePdf(buildDir: string): Promise<CompilationResult> {
	return new Promise((resolve) => {
		const mainTexPath = join(buildDir, "main.tex");
		let log = "";

		const proc = spawn(
			"pdflatex",
			["-interaction=nonstopmode", "-halt-on-error", `-output-directory=${buildDir}`, mainTexPath],
			{
				cwd: buildDir,
				timeout: COMPILE_TIMEOUT_MS,
			}
		);

		proc.stdout.on("data", (data: Buffer) => {
			log += data.toString();
		});

		proc.stderr.on("data", (data: Buffer) => {
			log += data.toString();
		});

		proc.on("close", (code) => {
			if (code === 0) {
				resolve({
					success: true,
					pdfPath: join(buildDir, "main.pdf"),
					log,
				});
			} else {
				resolve({
					success: false,
					error: `pdflatex exited with code ${code}`,
					log,
				});
			}
		});

		proc.on("error", (err) => {
			resolve({
				success: false,
				error: err.message,
				log,
			});
		});
	});
}
