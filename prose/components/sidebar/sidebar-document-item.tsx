"use client";

import { Delete02Icon, Edit02Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import axios from "axios";
import { useCallback, useState } from "react";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { DocumentSummary } from "@/hooks/use-documents";
import { useInvalidateLibrary } from "@/hooks/use-library";
import { DeleteDocumentAlertDialog } from "./delete-document-alert-dialog";
import { RenameDocumentDialog } from "./rename-document-dialog";

type SidebarDocumentItemProps = {
	doc: DocumentSummary;
	workspaceId: string;
	selectedId?: string;
	onSelect: (doc: DocumentSummary) => void;
	paddingLeft?: number;
};

export function SidebarDocumentItem({
	doc,
	workspaceId,
	selectedId,
	onSelect,
	paddingLeft = 24,
}: SidebarDocumentItemProps) {
	const [renameOpen, setRenameOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isRenaming, setIsRenaming] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const invalidateLibrary = useInvalidateLibrary(workspaceId);

	const handleRename = useCallback(
		async (newTitle: string) => {
			setIsRenaming(true);
			try {
				await axios.put(
					`/api/workspace/${workspaceId}/documents/${encodeURIComponent(doc.id)}`,
					{ title: newTitle }
				);
				invalidateLibrary();
			} finally {
				setIsRenaming(false);
			}
		},
		[workspaceId, doc.id, invalidateLibrary]
	);

	const handleDelete = useCallback(async () => {
		setIsDeleting(true);
		try {
			await axios.delete(
				`/api/workspace/${workspaceId}/documents/${encodeURIComponent(doc.id)}`
			);
			invalidateLibrary();
			setDeleteOpen(false);
		} catch (error) {
			console.error("Failed to delete document", error);
		} finally {
			setIsDeleting(false);
		}
	}, [workspaceId, doc.id, invalidateLibrary]);

	return (
		<>
			<SidebarMenuItem>
				<ContextMenu>
					<ContextMenuTrigger asChild>
						<SidebarMenuButton
							asChild
							isActive={doc.id === selectedId}
							onClick={() => onSelect(doc)}
							className="justify-start"
							style={{ paddingLeft: `${paddingLeft}px` }}
						>
							<button type="button" className="w-full text-left">
								<div className="flex flex-col">
									<span>{doc.title || "Untitled"}</span>
								</div>
							</button>
						</SidebarMenuButton>
					</ContextMenuTrigger>
					<ContextMenuContent>
						<ContextMenuItem onClick={() => {}}>
							<HugeiconsIcon icon={SparklesIcon} />
							Summarize
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem onClick={() => setRenameOpen(true)}>
							<HugeiconsIcon icon={Edit02Icon} />
							Edit
						</ContextMenuItem>
						<ContextMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
							<HugeiconsIcon icon={Delete02Icon} />
							Delete
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</SidebarMenuItem>

			<RenameDocumentDialog
				open={renameOpen}
				onOpenChange={setRenameOpen}
				currentTitle={doc.title}
				onRename={handleRename}
				isRenaming={isRenaming}
			/>

			<DeleteDocumentAlertDialog
				open={deleteOpen}
				onOpenChange={setDeleteOpen}
				documentTitle={doc.title}
				onDelete={handleDelete}
				isDeleting={isDeleting}
			/>
		</>
	);
}
