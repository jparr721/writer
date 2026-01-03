import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	createDocumentBodySchema,
	type DocumentListResponse,
	type DocumentResponse,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

export async function GET() {
	try {
		const allDocuments = await db.select().from(documents).orderBy(desc(documents.updatedAt));

		return NextResponse.json<DocumentListResponse>(allDocuments);
	} catch (error) {
		console.error("Failed to fetch documents:", error);
		return NextResponse.json({ error: "Failed to fetch documents" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function POST(request: Request) {
	try {
		const body = createDocumentBodySchema.parse(await request.json());

		const [newDocument] = await db
			.insert(documents)
			.values({
				...(body.title !== undefined && { title: body.title }),
				...(body.content !== undefined && { content: body.content }),
			})
			.returning();

		return NextResponse.json<DocumentResponse>(newDocument, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request body" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to create document:", error);
		return NextResponse.json({ error: "Failed to create document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
