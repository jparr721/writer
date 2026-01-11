"use client";

import { useState } from "react";
import type { WorkspaceResponse } from "@/app/api/schemas";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileBrowser } from "@/components/ui/file-browser";
import { Input } from "@/components/ui/input";
import { useCreateWorkspace } from "@/hooks/use-workspaces";

interface CreateWorkspaceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	existingNames: string[];
	onCreated: (workspace: WorkspaceResponse) => void;
}

export function CreateWorkspaceDialog({
	open,
	onOpenChange,
	existingNames,
	onCreated,
}: CreateWorkspaceDialogProps) {
	const createWorkspace = useCreateWorkspace();
	const [name, setName] = useState("");
	const [rootPath, setRootPath] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async () => {
		const trimmedName = name.trim();

		if (!trimmedName) {
			setError("Name is required");
			return;
		}

		if (!rootPath) {
			setError("Please select a folder");
			return;
		}

		const duplicate = existingNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase());
		if (duplicate) {
			setError("A workspace with that name already exists");
			return;
		}

		try {
			const workspace = await createWorkspace.mutateAsync({ name: trimmedName, rootPath });
			setError(null);
			setName("");
			setRootPath(null);
			onCreated(workspace);
		} catch (err) {
			console.error("Failed to create workspace", err);
			setError("Failed to create workspace");
		}
	};

	const handleClose = (isOpen: boolean) => {
		if (!isOpen) {
			setName("");
			setRootPath(null);
			setError(null);
		}
		onOpenChange(isOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Create workspace</DialogTitle>
					<DialogDescription>
						Choose a name and select the root directory for this workspace.
					</DialogDescription>
				</DialogHeader>
				<Input
					autoFocus
					placeholder="Workspace name"
					value={name}
					onChange={(e) => {
						setName(e.target.value);
						setError(null);
					}}
				/>
				{rootPath ? (
					<div className="flex items-center gap-2">
						<div className="flex-1 text-sm border border-border px-2 py-1.5 truncate bg-muted">
							{rootPath}
						</div>
						<Button variant="outline" size="sm" onClick={() => setRootPath(null)}>
							Change
						</Button>
					</div>
				) : (
					<FileBrowser
						onSelect={(path) => {
							setRootPath(path);
							setError(null);
						}}
					/>
				)}
				{error ? <p className="text-xs text-destructive">{error}</p> : null}
				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button
						variant="outline"
						onClick={() => handleClose(false)}
						disabled={createWorkspace.isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={createWorkspace.isPending || !rootPath}>
						{createWorkspace.isPending ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
