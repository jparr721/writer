"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkspaceSettings } from "@/hooks/use-workspace-settings";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { CreateWorkspaceDialog } from "./_components/create-workspace-dialog";
import { LoadingScreen } from "./_components/loading-screen";
import { NoWorkspaceView } from "./_components/no-workspace-view";
import { WorkspaceSelector } from "./_components/workspace-selector";

export default function Page() {
	const router = useRouter();
	const { settings, setWorkspaceId } = useWorkspaceSettings();
	const { data: workspaces, isLoading } = useWorkspaces();
	const [selectorOpen, setSelectorOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);

	// Redirect if we already have a workspace
	useEffect(() => {
		if (settings.workspaceId) {
			router.replace(`/workspace/${settings.workspaceId}`);
		}
	}, [settings.workspaceId, router]);

	// Show loading while fetching workspaces or redirecting
	if (isLoading || settings.workspaceId) {
		return <LoadingScreen />;
	}

	const hasWorkspaces = (workspaces?.length ?? 0) > 0;

	const handleSelect = (id: string) => {
		setWorkspaceId(id);
		setSelectorOpen(false);
		router.replace(`/workspace/${id}`);
	};

	const handleCreated = (workspace: { id: string }) => {
		setWorkspaceId(workspace.id);
		setCreateOpen(false);
		router.replace(`/workspace/${workspace.id}`);
	};

	return (
		<>
			<NoWorkspaceView
				hasWorkspaces={hasWorkspaces}
				onSelectClick={() => setSelectorOpen(true)}
				onCreateClick={() => setCreateOpen(true)}
			/>
			<WorkspaceSelector
				open={selectorOpen}
				onOpenChange={setSelectorOpen}
				workspaces={workspaces ?? []}
				onSelect={handleSelect}
			/>
			<CreateWorkspaceDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				existingNames={workspaces?.map((w) => w.name) ?? []}
				onCreated={handleCreated}
			/>
		</>
	);
}
