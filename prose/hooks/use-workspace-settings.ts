"use client";

import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";

type WorkspaceSettings = {
	workspaceId: string | null;
};

const DEFAULT_SETTINGS: WorkspaceSettings = {
	workspaceId: null,
};

export function useWorkspaceSettings() {
	const [settings, setSettings] = useLocalStorage<WorkspaceSettings>(
		"workspace-settings",
		DEFAULT_SETTINGS,
		{
			deserializer: (value) => {
				try {
					const parsed = JSON.parse(value) as WorkspaceSettings;
					return {
						workspaceId: parsed.workspaceId ?? null,
					};
				} catch {
					return DEFAULT_SETTINGS;
				}
			},
		}
	);

	const setWorkspaceId = useCallback(
		(workspaceId: string | null) => {
			setSettings({ workspaceId });
		},
		[setSettings]
	);

	return {
		settings,
		setWorkspaceId,
	};
}
