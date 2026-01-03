import { z } from "zod";
import type { Document, Workspace } from "@/lib/db/schema";

export const documentIdParamsSchema = z.object({
	id: z.uuid(),
});

export const createDocumentBodySchema = z.object({
	title: z.string().trim().optional(),
	content: z.string().optional(),
});

export const updateDocumentBodySchema = z.object({
	title: z.string().trim().optional(),
	content: z.string().optional(),
});

export const workspaceIdParamsSchema = z.object({
	id: z.uuid(),
});

export const createWorkspaceBodySchema = z.object({
	name: z.string().trim().min(1).max(255),
});

export type DocumentIdParams = z.infer<typeof documentIdParamsSchema>;
export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamsSchema>;
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;

export type ErrorResponse = { error: string };
export type SuccessResponse = { success: boolean };

export type DocumentResponse = Document;
export type DocumentListResponse = Document[];
export type WorkspaceResponse = Workspace;
export type WorkspaceListResponse = Workspace[];
export type ExportDocumentResponse = SuccessResponse & {
	filename: string;
	path: string;
};
