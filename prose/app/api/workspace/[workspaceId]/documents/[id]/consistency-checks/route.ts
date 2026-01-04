import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type ConsistencyCheckListResponse,
	documentIdParamsSchema,
	type ErrorResponse,
	type SuccessResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { consistencyChecks, documents, workspaces } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

async function ensureWorkspaceAndDocument(workspaceId: string, documentId: string) {
	const [workspace] = await db
		.select({ id: workspaces.id })
		.from(workspaces)
		.where(eq(workspaces.id, workspaceId))
		.limit(1);

	if (!workspace) {
		return { error: "Workspace not found" } as const;
	}

	const [document] = await db
		.select({ id: documents.id })
		.from(documents)
		.where(and(eq(documents.workspaceId, workspaceId), eq(documents.id, documentId)))
		.limit(1);

	if (!document) {
		return { error: "Document not found" } as const;
	}

	return { workspace, document } as const;
}

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		const checks = await db
			.select()
			.from(consistencyChecks)
			.where(
				and(eq(consistencyChecks.workspaceId, workspaceId), eq(consistencyChecks.documentId, id))
			);

		return NextResponse.json<ConsistencyCheckListResponse>(checks);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch consistency checks:", error);
		return NextResponse.json(
			{ error: "Failed to fetch consistency checks" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}

export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = documentIdParamsSchema
			.extend({ workspaceId: documentIdParamsSchema.shape.id })
			.parse(await params);

		const validation = await ensureWorkspaceAndDocument(workspaceId, id);
		if ("error" in validation) {
			return NextResponse.json({ error: validation.error } satisfies ErrorResponse, {
				status: 404,
			});
		}

		await db
			.delete(consistencyChecks)
			.where(
				and(eq(consistencyChecks.workspaceId, workspaceId), eq(consistencyChecks.documentId, id))
			);

		return NextResponse.json<SuccessResponse>({ success: true });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid document id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to delete consistency checks:", error);
		return NextResponse.json(
			{ error: "Failed to delete consistency checks" } satisfies ErrorResponse,
			{ status: 500 }
		);
	}
}
