import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type DocumentSummary = {
	id: string;
	title: string;
	updatedAt?: string;
};

export type Document = {
	id: string;
	title: string;
	content: string;
};

export type DocumentDraft = {
	id: string;
	workspaceId: string;
	documentId: string;
	content: string;
	createdAt?: string;
	updatedAt?: string;
};

export function useDocuments(workspaceId: string | null | undefined) {
	return useQuery({
		queryKey: ["documents", workspaceId],
		enabled: !!workspaceId,
		queryFn: async () => {
			const { data } = await axios.get<DocumentSummary[]>(
				`/api/workspace/${workspaceId}/documents`
			);
			return data;
		},
	});
}

export function useDocument(workspaceId: string | null | undefined, id: string | undefined) {
	return useQuery({
		queryKey: ["document", workspaceId, id],
		queryFn: async () => {
			const { data } = await axios.get<Document>(`/api/workspace/${workspaceId}/documents/${id}`);
			return data;
		},
		enabled: !!workspaceId && !!id,
	});
}

export function useSaveDocument(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
			const { data } = await axios.put<Document>(`/api/workspace/${workspaceId}/documents/${id}`, {
				title,
				content,
			});
			return data;
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["document", workspaceId, id] });
			queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
		},
	});
}

export function useInvalidateDocuments(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
}

export function useDocumentDraft(workspaceId: string | null | undefined, id: string | undefined) {
	return useQuery({
		queryKey: ["document-draft", workspaceId, id],
		queryFn: async () => {
			const { data } = await axios.get<DocumentDraft | null>(
				`/api/workspace/${workspaceId}/documents/${id}/draft`
			);
			return data;
		},
		enabled: !!workspaceId && !!id,
	});
}

export function useUpsertDocumentDraft(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, content }: { id: string; content: string }) => {
			const { data } = await axios.put<DocumentDraft>(
				`/api/workspace/${workspaceId}/documents/${id}/draft`,
				{
					content,
				}
			);
			return data;
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["document-draft", workspaceId, id] });
		},
	});
}

export function useDeleteDocumentDraft(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id }: { id: string }) => {
			await axios.delete(`/api/workspace/${workspaceId}/documents/${id}/draft`);
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["document-draft", workspaceId, id] });
		},
	});
}

export function useCommitDocumentDraft(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, content }: { id: string; content: string }) => {
			const { data } = await axios.post<Document>(
				`/api/workspace/${workspaceId}/documents/${id}/commit`,
				{
					content,
				}
			);
			return data;
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["document", workspaceId, id] });
			queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
			queryClient.invalidateQueries({ queryKey: ["document-draft", workspaceId, id] });
		},
	});
}
