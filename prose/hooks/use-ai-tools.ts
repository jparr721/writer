import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type {
	BookContextItem,
	CheckerResponse,
	ConsistencyCheckItem,
	EditorPassResponse,
	HelperResponse,
	SummarizeResponse,
} from "@/app/api/schemas";
import type { ConsistencyCheck, DocumentSummary, HelpSuggestion } from "@/lib/db/schema";

// Editor Pass
export function useEditorPass(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			content,
			promptContent,
		}: {
			documentId: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<EditorPassResponse>(
				`/api/workspace/${workspaceId}/ai/editor-pass`,
				{ documentId, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({ queryKey: ["document-draft", workspaceId, documentId] });
		},
	});
}

// Helper
export function useHelper(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			content,
			bookContext,
			specificRequests,
			promptContent,
		}: {
			documentId: string;
			content: string;
			bookContext?: string;
			specificRequests?: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<HelperResponse>(`/api/workspace/${workspaceId}/ai/helper`, {
				documentId,
				content,
				bookContext,
				specificRequests,
				promptContent,
			});
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, documentId],
			});
		},
	});
}

// Checker
export function useChecker(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			content,
			promptContent,
		}: {
			documentId: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<CheckerResponse>(
				`/api/workspace/${workspaceId}/ai/checker`,
				{ documentId, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["consistency-checks", workspaceId, documentId],
			});
		},
		onError: (error) => {
			console.error("Error checking document:", error);
		},
	});
}

// Summarize (AI-generated summary)
export function useSummarize(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			content,
			promptContent,
		}: {
			documentId: string;
			content: string;
			promptContent: string;
		}) => {
			const { data } = await axios.post<SummarizeResponse>(
				`/api/workspace/${workspaceId}/ai/summarize`,
				{ documentId, content, promptContent }
			);
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["document-summary", workspaceId, documentId],
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
	documentId: string | undefined
) {
	return useQuery({
		queryKey: ["help-suggestions", workspaceId, documentId],
		queryFn: async () => {
			const { data } = await axios.get<HelpSuggestion[]>(
				`/api/workspace/${workspaceId}/documents/${documentId}/help-suggestions`
			);
			return data;
		},
		enabled: !!workspaceId && !!documentId,
	});
}

export function useUpdateHelpSuggestion(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			suggestionId,
			response,
			completed,
		}: {
			documentId: string;
			suggestionId: string;
			response?: string;
			completed?: boolean;
		}) => {
			const { data } = await axios.put<HelpSuggestion>(
				`/api/workspace/${workspaceId}/documents/${documentId}/help-suggestions/${suggestionId}`,
				{ response, completed }
			);
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, documentId],
			});
		},
	});
}

export function useDeleteHelpSuggestion(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			documentId,
			suggestionId,
		}: {
			documentId: string;
			suggestionId: string;
		}) => {
			await axios.delete(
				`/api/workspace/${workspaceId}/documents/${documentId}/help-suggestions/${suggestionId}`
			);
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["help-suggestions", workspaceId, documentId],
			});
		},
	});
}

// Consistency Checks
export function useConsistencyChecks(
	workspaceId: string | null | undefined,
	documentId: string | undefined
) {
	return useQuery({
		queryKey: ["consistency-checks", workspaceId, documentId],
		queryFn: async () => {
			const { data } = await axios.get<ConsistencyCheck[]>(
				`/api/workspace/${workspaceId}/documents/${documentId}/consistency-checks`
			);
			return data;
		},
		enabled: !!workspaceId && !!documentId,
	});
}

export function useAcknowledgeConsistencyCheck(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ documentId, checkId }: { documentId: string; checkId: string }) => {
			await axios.put(
				`/api/workspace/${workspaceId}/documents/${documentId}/consistency-checks/${checkId}`,
				{ acknowledged: true }
			);
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["consistency-checks", workspaceId, documentId],
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
	documentId: string | undefined
) {
	return useQuery({
		queryKey: ["document-summary", workspaceId, documentId],
		queryFn: async () => {
			const { data } = await axios.get<DocumentSummary | null>(
				`/api/workspace/${workspaceId}/documents/${documentId}/summary`
			);
			return data;
		},
		enabled: !!workspaceId && !!documentId,
	});
}

export function useUpsertDocumentSummary(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ documentId, summary }: { documentId: string; summary: string }) => {
			const { data } = await axios.put<DocumentSummary>(
				`/api/workspace/${workspaceId}/documents/${documentId}/summary`,
				{ summary }
			);
			return data;
		},
		onSuccess: (_, { documentId }) => {
			queryClient.invalidateQueries({
				queryKey: ["document-summary", workspaceId, documentId],
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
