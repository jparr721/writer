"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useWorkspaceSettings } from "@/hooks/use-workspace-settings";
import { useCreateWorkspace, useWorkspaces } from "@/hooks/use-workspaces";

export default function WorkspaceSelector() {
	const router = useRouter();
	const { settings, setWorkspaceId } = useWorkspaceSettings();
	const { data: workspaces, isLoading: isLoadingWorkspaces } = useWorkspaces();
	const createWorkspace = useCreateWorkspace();
	const [switchOpen, setSwitchOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [newWorkspaceName, setNewWorkspaceName] = useState("");
	// TODO: Filesystem refactor - rootPath is now required for workspaces
	const [newWorkspaceRootPath, setNewWorkspaceRootPath] = useState("");
	const [createError, setCreateError] = useState<string | null>(null);

	const currentWorkspace = workspaces?.find((w) => w.id === settings.workspaceId) ?? null;
	const workspaceLabel = currentWorkspace?.name ?? "Select workspace";

	const handleSwitchWorkspace = useCallback(
		(id: string) => {
			setWorkspaceId(id);
			setSwitchOpen(false);
			router.push(`/workspace/${id}`);
		},
		[router, setWorkspaceId]
	);

	const handleCreateWorkspace = useCallback(async () => {
		if (!newWorkspaceName.trim()) {
			setCreateError("Name is required");
			return;
		}

		// TODO: Filesystem refactor - rootPath is now required
		if (!newWorkspaceRootPath.trim()) {
			setCreateError("Root path is required");
			return;
		}

		const duplicate = workspaces?.some(
			(w) => w.name.toLowerCase() === newWorkspaceName.trim().toLowerCase()
		);
		if (duplicate) {
			setCreateError("A workspace with that name already exists");
			return;
		}

		try {
			const workspace = await createWorkspace.mutateAsync({
				name: newWorkspaceName.trim(),
				rootPath: newWorkspaceRootPath.trim(),
			});
			setCreateError(null);
			setCreateOpen(false);
			setNewWorkspaceName("");
			setNewWorkspaceRootPath("");
			setWorkspaceId(workspace.id);
			router.push(`/workspace/${workspace.id}`);
		} catch (error: unknown) {
			console.error("Failed to create workspace", error);
			setCreateError("Failed to create workspace");
		}
	}, [createWorkspace, newWorkspaceName, newWorkspaceRootPath, router, setWorkspaceId, workspaces]);

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm">
						{workspaceLabel}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => setSwitchOpen(true)} disabled={isLoadingWorkspaces}>
						Switch workspace
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setCreateOpen(true)}>Create workspace</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<CommandDialog
				open={switchOpen}
				onOpenChange={setSwitchOpen}
				title="Switch workspace"
				description="Select a workspace to switch to"
			>
				<Command>
					<CommandInput placeholder="Search workspaces" />
					<CommandEmpty>No workspaces found.</CommandEmpty>
					<CommandGroup heading="Workspaces">
						{workspaces?.map((workspace) => (
							<CommandItem key={workspace.id} onSelect={() => handleSwitchWorkspace(workspace.id)}>
								{workspace.name}
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</CommandDialog>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create workspace</DialogTitle>
						<DialogDescription>Choose a unique name and root directory for this workspace.</DialogDescription>
					</DialogHeader>
					<Input
						autoFocus
						placeholder="Workspace name"
						value={newWorkspaceName}
						onChange={(e) => {
							setNewWorkspaceName(e.target.value);
							setCreateError(null);
						}}
					/>
					{/* TODO: Filesystem refactor - rootPath input for workspace root directory */}
					<Input
						placeholder="Root path (e.g., /path/to/project)"
						value={newWorkspaceRootPath}
						onChange={(e) => {
							setNewWorkspaceRootPath(e.target.value);
							setCreateError(null);
						}}
					/>
					{createError ? <p className="text-xs text-destructive">{createError}</p> : null}
					<DialogFooter className="flex items-center gap-2 sm:justify-end">
						<Button
							variant="outline"
							onClick={() => setCreateOpen(false)}
							disabled={createWorkspace.isPending}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateWorkspace} disabled={createWorkspace.isPending}>
							{createWorkspace.isPending ? (
								<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
							) : (
								"Create"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
