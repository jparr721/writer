import { z } from "zod";
import type {
	ConsistencyCheck,
	Document,
	DocumentDraft,
	DocumentSummary,
	HelpSuggestion,
	Workspace,
} from "@/lib/db/schema";

export const documentIdParamsSchema = z.object({
	id: z.uuid(),
});

export const folderIdParamsSchema = z.object({
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

export const upsertDraftBodySchema = z.object({
	content: z.string(),
});

export const commitDocumentBodySchema = z.object({
	content: z.string(),
});

export const workspaceIdParamsSchema = z.object({
	id: z.uuid(),
});

export const createWorkspaceBodySchema = z.object({
	name: z.string().trim().min(1).max(255),
});

export type DocumentIdParams = z.infer<typeof documentIdParamsSchema>;
export type FolderIdParams = z.infer<typeof folderIdParamsSchema>;
export type CreateDocumentBody = z.infer<typeof createDocumentBodySchema>;
export type UpdateDocumentBody = z.infer<typeof updateDocumentBodySchema>;
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamsSchema>;
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;

export type ErrorResponse = { error: string };
export type SuccessResponse = { success: boolean };

export type DocumentResponse = Document;
export type DocumentListResponse = Document[];
export type DocumentDraftResponse = DocumentDraft;
export type WorkspaceResponse = Workspace;
export type WorkspaceListResponse = Workspace[];
export type ExportDocumentResponse = SuccessResponse & {
	filename: string;
	path: string;
};

// AI Tools Schemas

// Editor Pass
export const editorPassBodySchema = z.object({
	documentId: z.uuid(),
	content: z.string(),
	promptContent: z.string(),
});

export type EditorPassBody = z.infer<typeof editorPassBodySchema>;
export type EditorPassResponse = {
	editedContent: string;
	draftId: string;
};

// Helper
export const helperBodySchema = z.object({
	documentId: z.uuid(),
	content: z.string(),
	bookContext: z.string().optional(),
	specificRequests: z.string().optional(),
	promptContent: z.string(),
});

export type HelperBody = z.infer<typeof helperBodySchema>;
export type HelperResponse = {
	suggestionId: string;
	response: string;
};

// Checker
export const checkerBodySchema = z.object({
	documentId: z.uuid(),
	content: z.string(),
	promptContent: z.string(),
});

export const consistencyCheckItemSchema = z.object({
	line: z.number(),
	original: z.string(),
	fixed: z.string(),
	type: z.enum(["punctuation", "repetition", "tense", "combined"]),
});

export type CheckerBody = z.infer<typeof checkerBodySchema>;
export type ConsistencyCheckItem = z.infer<typeof consistencyCheckItemSchema>;
export type CheckerResponse = {
	checks: ConsistencyCheckItem[];
	draftId: string;
};

// Document Summary
export const upsertSummaryBodySchema = z.object({
	summary: z.string(),
});

export type UpsertSummaryBody = z.infer<typeof upsertSummaryBodySchema>;
export type DocumentSummaryResponse = DocumentSummary;

// Help Suggestion
export const updateHelpSuggestionBodySchema = z.object({
	response: z.string().optional(),
	completed: z.boolean().optional(),
});

export type UpdateHelpSuggestionBody = z.infer<typeof updateHelpSuggestionBodySchema>;
export type HelpSuggestionResponse = HelpSuggestion;
export type HelpSuggestionListResponse = HelpSuggestion[];

// Consistency Check
export type ConsistencyCheckResponse = ConsistencyCheck;
export type ConsistencyCheckListResponse = ConsistencyCheck[];

// Book Context
export type BookContextItem = {
	documentId: string;
	title: string;
	summary: string;
};
export type BookContextResponse = BookContextItem[];

// Book Files
export const createBookBodySchema = z.object({
	files: z.array(
		z.object({
			documentId: z.string().uuid(),
			nodeType: z.enum(["chapter", "appendix", "frontmatter", "backmatter"]),
			position: z.number().int().min(0),
		})
	),
});

export type CreateBookBody = z.infer<typeof createBookBodySchema>;
export type BookFileResponse = {
	id: string;
	documentId: string;
	nodeType: string;
	position: number;
};
export type BookResponse = { files: BookFileResponse[] };
