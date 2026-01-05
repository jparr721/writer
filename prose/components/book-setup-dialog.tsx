"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContentFullscreen,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DraggableTable } from "@/components/ui/draggable-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type NodeType = "chapter" | "appendix" | "frontmatter" | "backmatter";

type LibraryDocument = {
	id: string;
	title: string;
	folderId: string | null;
	updatedAt: string | null;
};

type DocWithType = {
	id: string;
	title: string;
	nodeType: NodeType;
};

type BookSetupDialogProps = {
	workspaceId: string;
	documents: LibraryDocument[];
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
	chapter: "Chapter",
	frontmatter: "Frontmatter",
	backmatter: "Backmatter",
	appendix: "Appendix",
};

export default function BookSetupDialog({ workspaceId, documents }: BookSetupDialogProps) {
	const [open, setOpen] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [orderedDocs, setOrderedDocs] = useState<DocWithType[]>(() =>
		documents.map((doc) => ({
			id: doc.id,
			title: doc.title,
			nodeType: "chapter" as NodeType,
		}))
	);

	// Reset state when dialog opens
	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			setOpen(isOpen);
			if (isOpen) {
				// Reset to current documents with default nodeType
				setOrderedDocs(
					documents.map((doc) => ({
						id: doc.id,
						title: doc.title,
						nodeType: "chapter" as NodeType,
					}))
				);
				setSelectedIds([]);
			}
		},
		[documents]
	);

	const updateNodeType = useCallback((docId: string, nodeType: NodeType) => {
		setOrderedDocs((prev) => prev.map((doc) => (doc.id === docId ? { ...doc, nodeType } : doc)));
	}, []);

	const columns = useMemo<ColumnDef<DocWithType>[]>(
		() => [
			{
				accessorKey: "title",
				header: "Title",
				cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
			},
			{
				accessorKey: "nodeType",
				header: "Type",
				cell: ({ row }) => (
					<Select
						value={row.original.nodeType}
						onValueChange={(value) => updateNodeType(row.original.id, value as NodeType)}
					>
						<SelectTrigger
							className="h-8 w-32"
							onClick={(e) => e.stopPropagation()}
							onPointerDown={(e) => e.stopPropagation()}
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(NODE_TYPE_LABELS).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				),
			},
		],
		[updateNodeType]
	);

	const handleCreateBook = useCallback(async () => {
		if (selectedIds.length === 0) return;

		setIsCreating(true);
		try {
			// Build files array with positions based on selection order within orderedDocs
			const selectedDocs = orderedDocs.filter((doc) => selectedIds.includes(doc.id));
			const files = selectedDocs.map((doc, index) => ({
				documentId: doc.id,
				nodeType: doc.nodeType,
				position: index,
			}));

			await axios.post(`/api/workspace/${workspaceId}/book`, { files });

			setOpen(false);
		} catch (error) {
			console.error("Failed to create book", error);
		} finally {
			setIsCreating(false);
		}
	}, [orderedDocs, selectedIds, workspaceId]);

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant="default">Create Book</Button>
			</DialogTrigger>
			<DialogContentFullscreen>
				<DialogHeader>
					<DialogTitle>Create Book</DialogTitle>
					<DialogDescription>
						Select documents to include in your book, set their types, and drag to reorder.
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[60vh] overflow-auto rounded border">
					<DraggableTable
						data={orderedDocs}
						columns={columns}
						getRowId={(row) => row.id}
						selectedIds={selectedIds}
						onSelectionChange={setSelectedIds}
						onReorder={setOrderedDocs}
					/>
				</div>

				<div className="text-xs text-muted-foreground">
					{selectedIds.length} of {orderedDocs.length} documents selected
				</div>

				<DialogFooter className="flex items-center gap-2 sm:justify-end">
					<Button variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
						Cancel
					</Button>
					<Button onClick={handleCreateBook} disabled={selectedIds.length === 0 || isCreating}>
						{isCreating ? (
							<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
						) : (
							"Create Book"
						)}
					</Button>
				</DialogFooter>
			</DialogContentFullscreen>
		</Dialog>
	);
}
