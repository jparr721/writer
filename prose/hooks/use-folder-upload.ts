import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { PendingFile, UploadProgress, ImportSummary } from "@/lib/upload/types";
import { buildFormData } from "@/lib/upload/utils";

type BatchUploadState = {
	isUploading: boolean;
	progress: UploadProgress | null;
	error: Error | null;
};

export function useFolderUpload(workspaceId: string | null) {
	const queryClient = useQueryClient();

	const [state, setState] = useState<BatchUploadState>({
		isUploading: false,
		progress: null,
		error: null,
	});

	const upload = useCallback(
		async (files: PendingFile[]): Promise<ImportSummary | null> => {
			if (!workspaceId || !files.length) return null;

			setState({ isUploading: true, progress: { loaded: 0, total: 0, completed: 0 }, error: null });

			try {
				const formData = buildFormData(files);

				const { data } = await axios.post<ImportSummary>(
					`/api/workspace/${workspaceId}/documents/import`,
					formData,
					{
						headers: { "Content-Type": "multipart/form-data" },
						onUploadProgress: (event) => {
							if (event.total) {
								setState((prev) => ({
									...prev,
									progress: {
										loaded: event.loaded,
										total: event.total!,
										completed: Math.round((event.loaded * 100) / event.total!),
									},
								}));
							}
						},
					}
				);

				queryClient.invalidateQueries({ queryKey: ["documents", workspaceId] });
				queryClient.invalidateQueries({ queryKey: ["library", workspaceId] });

				setState({ isUploading: false, progress: null, error: null });
				return data;
			} catch (error) {
				const err = error instanceof Error ? error : new Error("Upload failed");
				setState({ isUploading: false, progress: null, error: err });
				throw err;
			}
		},
		[workspaceId, queryClient]
	);

	const reset = useCallback(() => {
		setState({ isUploading: false, progress: null, error: null });
	}, []);

	return {
		upload,
		reset,
		isUploading: state.isUploading,
		progress: state.progress,
		error: state.error,
	};
}
