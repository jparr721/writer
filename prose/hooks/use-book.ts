"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { BookResponse } from "@/app/api/schemas";

export function useBook(workspaceId: string | null | undefined) {
	return useQuery({
		queryKey: ["book", workspaceId],
		queryFn: async () => {
			const { data } = await axios.get<BookResponse>(`/api/workspace/${workspaceId}/book`);
			return data;
		},
		enabled: !!workspaceId,
	});
}
