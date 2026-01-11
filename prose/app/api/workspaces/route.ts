import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
	createWorkspaceBodySchema,
	type ErrorResponse,
	type WorkspaceListResponse,
} from "@/app/api/schemas";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";

export async function GET() {
	try {
		const rows = await db.select().from(workspaces);
		return NextResponse.json<WorkspaceListResponse>(rows);
	} catch (error) {
		console.error("Failed to fetch workspaces", error);
		return NextResponse.json({ error: "Failed to fetch workspaces" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}

export async function POST(request: Request) {
	try {
		const body = createWorkspaceBodySchema.parse(await request.json());

		const existing = await db
			.select()
			.from(workspaces)
			.where(eq(workspaces.name, body.name))
			.limit(1);
		if (existing[0]) {
			return NextResponse.json({ error: "Workspace already exists" } satisfies ErrorResponse, {
				status: 409,
			});
		}

		const [created] = await db
			.insert(workspaces)
			.values({ name: body.name, rootPath: body.rootPath })
			.returning();
		return NextResponse.json(created, { status: 201 });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: "Invalid workspace payload" } satisfies ErrorResponse, {
				status: 400,
			});
		}

		console.error("Failed to create workspace", error);
		return NextResponse.json({ error: "Failed to create workspace" } satisfies ErrorResponse, {
			status: 500,
		});
	}
}
