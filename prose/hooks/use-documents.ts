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

export function useDocuments() {
	return useQuery({
		queryKey: ["documents"],
		queryFn: async () => {
			const { data } = await axios.get<DocumentSummary[]>("/api/documents");
			return data;
		},
	});
}

export function useDocument(id: string | undefined) {
	return useQuery({
		queryKey: ["document", id],
		queryFn: async () => {
			const { data } = await axios.get<Document>(`/api/documents/${id}`);
			return data;
		},
		enabled: !!id,
	});
}

export function useSaveDocument() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, title, content }: { id: string; title: string; content: string }) => {
			const { data } = await axios.put<Document>(`/api/documents/${id}`, { title, content });
			return data;
		},
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["document", id] });
			queryClient.invalidateQueries({ queryKey: ["documents"] });
		},
	});
}

export function useInvalidateDocuments() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ["documents"] });
}
