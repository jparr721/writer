"use client";

import type { WorkspaceResponse } from "@/app/api/schemas";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";

interface WorkspaceSelectorProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaces: WorkspaceResponse[];
	onSelect: (id: string) => void;
}

export function WorkspaceSelector({
	open,
	onOpenChange,
	workspaces,
	onSelect,
}: WorkspaceSelectorProps) {
	return (
		<CommandDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Select workspace"
			description="Choose a workspace to open"
		>
			<Command>
				<CommandInput placeholder="Search workspaces..." />
				<CommandEmpty>No workspaces found.</CommandEmpty>
				<CommandGroup heading="Workspaces">
					{workspaces.map((workspace) => (
						<CommandItem key={workspace.id} onSelect={() => onSelect(workspace.id)}>
							{workspace.name}
						</CommandItem>
					))}
				</CommandGroup>
			</Command>
		</CommandDialog>
	);
}
