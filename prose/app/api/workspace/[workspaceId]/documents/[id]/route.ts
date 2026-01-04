import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	type DocumentIdParams,
	type DocumentResponse,
	type ErrorResponse,
	type SuccessResponse,
	updateDocumentBodySchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.uuid(),
});

type RouteParams = { params: Promise<DocumentIdParams & { workspaceId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);

		const [document] = await db
			.select()
			.from(documents)
			.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, id)));

		if (!document) {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<DocumentResponse>(document);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch document:", error);
		return NextResponse.json({ error: "Failed to fetch document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const body = updateDocumentBodySchema.parse(await request.json());

		const updates: { title?: string; content?: string; updatedAt: Date } = {
			updatedAt: new Date(),
		};

		if (body.title !== undefined) {
			updates.title = body.title;
		}
		if (body.content !== undefined) {
			updates.content = body.content;
		}

		const [updatedDocument] = await db
			.update(documents)
			.set(updates)
			.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, id)))
			.returning();

		if (!updatedDocument) {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<DocumentResponse>(updatedDocument);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid request" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to update document:", error);
		return NextResponse.json({ error: "Failed to update document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);

		const [deletedDocument] = await db
			.delete(documents)
			.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, id)))
			.returning();

		if (!deletedDocument) {
			return NextResponse.json({ error: "Document not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json<SuccessResponse>({ success: true });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to delete document", error);
		return NextResponse.json({ error: "Failed to delete document" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
