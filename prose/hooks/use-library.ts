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

export function useLibrary() {
	return useQuery({
		queryKey: ["library"],
		queryFn: async () => {
			const { data } = await axios.get<LibraryResponse>("/api/library");
			return data;
		},
	});
}

export function useInvalidateLibrary() {
	const queryClient = useQueryClient();
	return () => queryClient.invalidateQueries({ queryKey: ["library"] });
}

