// TODO: Filesystem refactor - All hooks now use filePath instead of documentId
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
	BookContextItem,
	CheckerResponse,
	EditorPassResponse,
	HelperResponse,
	RewriterResponse,
	SummarizeResponse,
} from "@/app/api/schemas";
import type { ConsistencyCheck, DocumentSummary, HelpSuggestion } from "@/lib/db/schema";

// Editor Pass
export function useEditorPass(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			content,
			promptContent,
		}: {
			filePath: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<EditorPassResponse>(
				`/api/workspace/${workspaceId}/ai/editor-pass`,
				{ filePath, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({ queryKey: ["document-draft", workspaceId, filePath] });
		},
	});
}

// Helper
export function useHelper(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			content,
			bookContext,
			specificRequests,
			promptContent,
		}: {
			filePath: string;
			content: string;
			bookContext?: string;
			specificRequests?: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<HelperResponse>(`/api/workspace/${workspaceId}/ai/helper`, {
				filePath,
				content,
				bookContext,
				specificRequests,
				promptContent,
			});
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, filePath],
			});
		},
	});
}

// Checker
export function useChecker(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			content,
			promptContent,
		}: {
			filePath: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<CheckerResponse>(
				`/api/workspace/${workspaceId}/ai/checker`,
				{ filePath, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["consistency-checks", workspaceId, filePath],
			});
		},
		onError: (error) => {
			console.error("Error checking document:", error);
		},
	});
}

// Rewriter
export function useRewriter(workspaceId: string | null | undefined) {
	return useMutation({
		mutationFn: async ({
			filePath,
			selectedText,
			instructions,
			bookContext,
			currentChapter,
			promptContent,
		}: {
			filePath: string;
			selectedText: string;
			instructions: string;
			bookContext: string;
			currentChapter: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<RewriterResponse>(
				`/api/workspace/${workspaceId}/ai/rewriter`,
				{ filePath, selectedText, instructions, bookContext, currentChapter, promptContent }
			);
			return data;
		},
	});
}

// Summarize (AI-generated summary)
export function useSummarize(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			content,
			promptContent,
		}: {
			filePath: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<SummarizeResponse>(
				`/api/workspace/${workspaceId}/ai/summarize`,
				{ filePath, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["document-summary", workspaceId, filePath],
			});
			queryClient.invalidateQueries({
				queryKey: ["book-context", workspaceId],
			});
		},
	});
}

// Help Suggestions
export function useHelpSuggestions(
	workspaceId: string | null | undefined,
	filePath: string | undefined
) {
	return useQuery({
		queryKey: ["help-suggestions", workspaceId, filePath],
		queryFn: async () => {
			const { data } = await axios.get<HelpSuggestion[]>(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath!)}/help-suggestions`
			);
			return data;
		},
		enabled: !!workspaceId && !!filePath,
	});
}

export function useUpdateHelpSuggestion(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			suggestionId,
			response,
			completed,
		}: {
			filePath: string;
			suggestionId: string;
			response?: string;
			completed?: boolean;
		}) => {
			const { data } = await axios.put<HelpSuggestion>(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath)}/help-suggestions/${suggestionId}`,
				{ response, completed }
			);
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, filePath],
			});
		},
	});
}

export function useDeleteHelpSuggestion(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			filePath,
			suggestionId,
		}: {
			filePath: string;
			suggestionId: string;
		}) => {
			await axios.delete(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath)}/help-suggestions/${suggestionId}`
			);
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, filePath],
			});
		},
	});
}

// Consistency Checks
export function useConsistencyChecks(
	workspaceId: string | null | undefined,
	filePath: string | undefined
) {
	return useQuery({
		queryKey: ["consistency-checks", workspaceId, filePath],
		queryFn: async () => {
			const { data } = await axios.get<ConsistencyCheck[]>(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath!)}/consistency-checks`
			);
			return data;
		},
		enabled: !!workspaceId && !!filePath,
	});
}

export function useAcknowledgeConsistencyCheck(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ filePath, checkId }: { filePath: string; checkId: string }) => {
			await axios.put(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath)}/consistency-checks/${checkId}`,
				{ acknowledged: true }
			);
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["consistency-checks", workspaceId, filePath],
			});
		},
	});
}

// Book Context (all chapter summaries)
export function useBookContext(workspaceId: string | null | undefined) {
	return useQuery({
		queryKey: ["book-context", workspaceId],
		queryFn: async () => {
			const { data } = await axios.get<BookContextItem[]>(
				`/api/workspace/${workspaceId}/book-context`
			);
			return data;
		},
		enabled: !!workspaceId,
	});
}

// Document Summary
export function useDocumentSummary(
	workspaceId: string | null | undefined,
	filePath: string | undefined
) {
	return useQuery({
		queryKey: ["document-summary", workspaceId, filePath],
		queryFn: async () => {
			const { data } = await axios.get<DocumentSummary | null>(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath!)}/summary`
			);
			return data;
		},
		enabled: !!workspaceId && !!filePath,
	});
}

export function useUpsertDocumentSummary(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ filePath, summary }: { filePath: string; summary: string }) => {
			const { data } = await axios.put<DocumentSummary>(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(filePath)}/summary`,
				{ summary }
			);
			return data;
		},
		onSuccess: (_, { filePath }) => {
			queryClient.invalidateQueries({
				queryKey: ["document-summary", workspaceId, filePath],
			});
			queryClient.invalidateQueries({
				queryKey: ["book-context", workspaceId],
			});
		},
	});
}

// Provider
export function useProvider(workspaceId: string | null | undefined) {
	return useQuery({
		queryKey: ["provider", workspaceId],
		queryFn: async () => {
			const { data } = await axios.get<{ name: string }>(
				`/api/workspace/${workspaceId}/ai/provider`
			);
			return data;
		},
		enabled: !!workspaceId,
	});
}
