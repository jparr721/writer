// TODO: Filesystem refactor - this route now uses filePath instead of documentId
// The [id] param now represents a URL-encoded filePath

import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import {
	type ConsistencyCheckListResponse,
	type ErrorResponse,
	type SuccessResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { consistencyChecks } from "@/lib/db/schema";

type RouteParams = { params: Promise<{ workspaceId: string; id: string }> };

const paramsSchema = z.object({
	workspaceId: z.uuid(),
	id: z.string(), // This is now the filePath (URL-encoded)
});

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

		const checks = await db
			.select()
			.from(consistencyChecks)
			.where(
				and(eq(consistencyChecks.workspaceId, workspaceId), eq(consistencyChecks.filePath, filePath))
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
		const { workspaceId, id } = paramsSchema.parse(await params);
		const filePath = decodeURIComponent(id);

		await db
			.delete(consistencyChecks)
			.where(
				and(eq(consistencyChecks.workspaceId, workspaceId), eq(consistencyChecks.filePath, filePath))
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
