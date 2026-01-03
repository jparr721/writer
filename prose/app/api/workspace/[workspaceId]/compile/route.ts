import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { runCompilationPipeline } from "@/lib/latex";

const paramsSchema = z.object({
	workspaceId: z.uuid(),
});

export async function POST(
	_request: Request,
	{ params }: { params: Promise<{ workspaceId: string }> }
) {
	try {
		const { workspaceId } = paramsSchema.parse(await params);

		// Verify workspace exists
		const [workspace] = await db
			.select({ id: workspaces.id })
			.from(workspaces)
			.where(eq(workspaces.id, workspaceId))
			.limit(1);

		if (!workspace) {
			return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
		}

		// Run compilation pipeline
		const result = await runCompilationPipeline(workspaceId);

		if (!result.success) {
			return NextResponse.json(
				{ error: result.error, log: result.log },
				{ status: 422 }
			);
		}

		// Return PDF binary
		return new NextResponse(result.pdf, {
			status: 200,
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": 'inline; filename="document.pdf"',
				"Cache-Control": "no-cache",
			},
		});
	} catch (error) {
		console.error("Compilation failed:", error);
		return NextResponse.json(
			{ error: "Internal compilation error" },
			{ status: 500 }
		);
	}
}
