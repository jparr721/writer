import { z } from "zod";
import type {
	ConsistencyCheck,
	DocumentDraft,
	DocumentSummary,
	HelpSuggestion,
	Workspace,
} from "@/lib/db/schema";

// TODO: Filesystem refactor - Document type moved to filesystem
// This is a temporary stub type for API compatibility
export type Document = {
	id: string;
	workspaceId: string;
	filePath: string;
	title: string;
	content: string;
	createdAt: Date;
	updatedAt: Date;
};

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
	rootPath: z.string().trim().min(1),
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
	filePath: z.string(),
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
	filePath: z.string(),
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
	filePath: z.string(),
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

// Summarize (AI-generated summary)
export const summarizeBodySchema = z.object({
	filePath: z.string(),
	content: z.string(),
	promptContent: z.string(),
});

export type SummarizeBody = z.infer<typeof summarizeBodySchema>;
export type SummarizeResponse = {
	summary: string;
	summaryId: string;
};

// Rewriter
export const rewriterBodySchema = z.object({
	filePath: z.string(),
	selectedText: z.string(),
	instructions: z.string(),
	bookContext: z.string(),
	currentChapter: z.string(),
	promptContent: z.string(),
});

export type RewriterBody = z.infer<typeof rewriterBodySchema>;
export type RewriterResponse = {
	rewrittenText: string;
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
	filePath: string;
	title: string;
	summary: string;
	position: number;
};
export type BookContextResponse = BookContextItem[];

// Book Files
export const createBookBodySchema = z.object({
	files: z.array(
		z.object({
			filePath: z.string(),
			nodeType: z.enum(["chapter", "appendix", "frontmatter", "backmatter"]),
			position: z.number().int().min(0),
		})
	),
});

export type CreateBookBody = z.infer<typeof createBookBodySchema>;
export type BookFileResponse = {
	id: string;
	filePath: string;
	nodeType: string;
	position: number;
};
export type BookResponse = { files: BookFileResponse[] };
