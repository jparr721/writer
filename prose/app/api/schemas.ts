import { z } from "zod";
import type { Document } from "@/lib/db/schema";

export const documentIdParamsSchema = z.object({
	id: z.string().uuid(),
});

export const createDocumentBodySchema = z.object({
	title: z.string().trim().optional(),
	content: z.string().optional(),
});

export const updateDocumentBodySchema = z.object({
	title: z.string().trim().optional(),
	content: z.string().optional(),
});

export type DocumentIdParams = z.infer<typeof documentIdParamsSchema>;
export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;

export type ErrorResponse = { error: string };
export type SuccessResponse = { success: boolean };

export type DocumentResponse = Document;
export type DocumentListResponse = Document[];
export type ExportDocumentResponse = SuccessResponse & {
	filename: string;
	path: string;
};
