import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	type ErrorResponse,
	type WorkspaceIdParams,
	workspaceIdParamsSchema,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

type RouteParams = { params: Promise<WorkspaceIdParams> };

export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { id } = workspaceIdParamsSchema.parse(await params);
		const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);

		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" } satisfies ErrorResponse, {
				status: 404,
			});
		}

		return NextResponse.json(workspace);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid workspace id" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to fetch workspace", error);
		return NextResponse.json({ error: "Failed to fetch workspace" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
