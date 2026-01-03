import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	createDocumentBodySchema,
	type DocumentListResponse,
	type DocumentResponse,
	type ErrorResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { documents, workspaces } from "@/lib/db/schema";

const workspaceParamsSchema = z.object({
	workspaceId: z.uuid(),
});

export async function GET(
	_request: Request,
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
			return NextResponse.json({ error: "Workspace not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const allDocuments = await db
			.select()
			.from(documents)
			.where(eq(documents.workspaceId, workspaceId))
			.orderBy(desc(documents.updatedAt));

		return NextResponse.json<DocumentListResponse>(allDocuments);
	} catch (error) {
		console.error("Failed to fetch documents:", error);
		return NextResponse.json({ error: "Failed to fetch documents" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = workspaceParamsSchema.parse(await params);
		const body = createDocumentBodySchema.parse(await request.json());

		const [workspace] = await db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);
		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const [newDocument] = await db
			.insert(documents)
			.values({
				workspaceId,
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
