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
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			setError("Name is required");
			return;
		}

		const duplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase());
		if (duplicate) {
			setError("A workspace with that name already exists");
			return;
		}

		try {
			const workspace = await createWorkspace.mutateAsync({ name: trimmed });
			setError(null);
			setName("");
			onCreated(workspace);
		} catch (err) {
			console.error("Failed to create workspace", err);
			setError("Failed to create workspace");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create workspace</DialogTitle>
					<DialogDescription>Choose a unique name for this workspace.</DialogDescription>
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
				{error ? <p className="text-xs text-destructive">{error}</p> : null}
				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={createWorkspace.isPending}
					>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={createWorkspace.isPending}>
						{createWorkspace.isPending ? "Creating..." : "Create"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
