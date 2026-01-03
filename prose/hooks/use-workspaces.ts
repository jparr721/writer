import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { CreateWorkspaceBody, WorkspaceResponse } from "@/app/api/schemas";

export function useWorkspaces() {
	return useQuery({
		queryKey: ["workspaces"],
		queryFn: async () => {
			const { data } = await axios.get<WorkspaceResponse[]>("/api/workspaces");
			return data;
		},
	});
}

export function useCreateWorkspace() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (body: CreateWorkspaceBody) => {
			const { data } = await axios.post<WorkspaceResponse>("/api/workspaces", body);
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workspaces"] });
		},
	});
}
