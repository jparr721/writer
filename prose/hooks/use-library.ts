import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type LibraryFolder = {
	id: string;
	name: string;
	parentId: string | null;
};

export type LibraryDocument = {
	id: string;
	title: string;
	folderId: string | null;
	updatedAt: string | null;
};

export type LibraryResponse = {
	folders: LibraryFolder[];
	documents: LibraryDocument[];
};

export function useLibrary(workspaceId: string | null | undefined) {
	return useQuery({
		queryKey: ["library", workspaceId],
		enabled: !!workspaceId,
		queryFn: async () => {
			const { data } = await axios.get<LibraryResponse>(`/api/workspace/${workspaceId}/library`);
			return data;
		},
	});
}

export function useInvalidateLibrary(workspaceId: string | null | undefined) {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ["library", workspaceId] });
}
