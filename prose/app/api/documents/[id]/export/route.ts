import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type DocumentIdParams,
	documentIdParamsSchema,
	type ErrorResponse,
	type ExportDocumentResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

type RouteParams = { params: Promise<DocumentIdParams> };

export async function POST(_request: Request, { params }: RouteParams) {
	try {
		const { id } = documentIdParamsSchema.parse(await params);

		const [document] = await db.select().from(documents).where(eq(documents.id, id));

		if (!document) {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const exportsDir = join(process.cwd(), "exports");
		await mkdir(exportsDir, { recursive: true });

		const filename = `${id}.txt`;
		const filePath = join(exportsDir, filename);

		await writeFile(filePath, document.content, "utf-8");

		return NextResponse.json<ExportDocumentResponse>({
			success: true,
			filename,
			path: filePath,
		});
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to export document:", error);
		return NextResponse.json({ error: "Failed to export document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
