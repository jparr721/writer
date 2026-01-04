import { useMutation } from "@tanstack/react-query";
import axios, { type AxiosError } from "axios";

export type CompilationError = {
	error: string;
	log?: string;
};

export function useCompilePdf(workspaceId: string | null | undefined) {
	return useMutation({
		mutationFn: async (): Promise<Blob> => {
			const response = await axios.post(
				`/api/workspace/${workspaceId}/compile`,
				{},
				{ responseType: "blob" }
			);

			// Check if response is actually a JSON error (content-type check)
			const contentType = response.headers["content-type"];
			if (contentType?.includes("application/json")) {
				const text = await response.data.text();
				const error = JSON.parse(text) as CompilationError;
				throw new Error(error.error);
			}

			return response.data;
		},
		onError: (error: AxiosError<Blob>) => {
			// Handle error responses that come back as blobs
			if (error.response?.data instanceof Blob) {
				error.response.data.text().then((text) => {
					try {
						const parsed = JSON.parse(text) as CompilationError;
						console.error("Compilation error:", parsed.error);
						if (parsed.log) {
							console.error("Compilation log:", parsed.log);
						}
					} catch {
						console.error("Compilation failed:", text);
					}
				});
			}
		},
	});
}
