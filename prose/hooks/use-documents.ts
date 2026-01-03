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
