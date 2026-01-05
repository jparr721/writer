"use client";

import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookFileResponse } from "@/app/api/schemas";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContentFullscreen,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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

type BookFileWithTitle = BookFileResponse & {
	title: string;
};

type BookViewDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string | null;
	documents: Array<{ id: string; title: string }>;
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
	chapter: "Chapter",
	frontmatter: "Frontmatter",
	backmatter: "Backmatter",
	appendix: "Appendix",
};

export default function BookViewDialog({
	open,
	onOpenChange,
	workspaceId,
	documents,
}: BookViewDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [bookFiles, setBookFiles] = useState<BookFileWithTitle[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	// Fetch book structure when dialog opens
	useEffect(() => {
		if (!open || !workspaceId) return;

		async function fetchBook() {
			setIsLoading(true);
			try {
				const response = await axios.get(`/api/workspace/${workspaceId}/book`);
				const files = response.data.files as BookFileResponse[];

				// Enrich with document titles
				const docMap = new Map(documents.map((d) => [d.id, d.title]));
				const enriched = files.map((f) => ({
					...f,
					title: docMap.get(f.documentId) || "Unknown",
				}));

				setBookFiles(enriched);
				setSelectedIds(enriched.map((f) => f.id));
			} catch (error) {
				console.error("Failed to fetch book", error);
				setBookFiles([]);
			} finally {
				setIsLoading(false);
			}
		}

		fetchBook();
	}, [open, workspaceId, documents]);

	const updateNodeType = useCallback((id: string, nodeType: NodeType) => {
		setBookFiles((prev) =>
			prev.map((f) => (f.id === id ? { ...f, nodeType } : f))
		);
	}, []);

	const columns = useMemo<ColumnDef<BookFileWithTitle>[]>(
		() => [
			{
				accessorKey: "position",
				header: "#",
				cell: ({ row }) => (
					<span className="font-mono text-muted-foreground">
						{bookFiles.findIndex((f) => f.id === row.original.id) + 1}
					</span>
				),
			},
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
		[bookFiles, updateNodeType]
	);

	const handleSave = useCallback(async () => {
		if (!workspaceId) return;

		setIsSaving(true);
		try {
			// Only save selected files with updated positions
			const selectedFiles = bookFiles.filter((f) => selectedIds.includes(f.id));
			const files = selectedFiles.map((f, index) => ({
				documentId: f.documentId,
				nodeType: f.nodeType,
				position: index,
			}));

			await axios.post(`/api/workspace/${workspaceId}/book`, { files });
			onOpenChange(false);
		} catch (error) {
			console.error("Failed to save book", error);
		} finally {
			setIsSaving(false);
		}
	}, [bookFiles, selectedIds, workspaceId, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContentFullscreen>
				<DialogHeader>
					<DialogTitle>Book Structure</DialogTitle>
					<DialogDescription>
						View and re-arrange the order of documents in your book. Drag to reorder.
					</DialogDescription>
				</DialogHeader>

				{isLoading ? (
					<div className="flex items-center justify-center py-8">
						<HugeiconsIcon icon={Loading03Icon} className="size-6 animate-spin" />
					</div>
				) : bookFiles.length === 0 ? (
					<div className="py-8 text-center text-muted-foreground">
						No book structure defined yet. Use "Create Book" to set one up.
					</div>
				) : (
					<div className="flex-1 overflow-auto rounded border">
						<DraggableTable
							data={bookFiles}
							columns={columns}
							getRowId={(row) => row.id}
							selectedIds={selectedIds}
							onSelectionChange={setSelectedIds}
							onReorder={setBookFiles}
						/>
					</div>
				)}

				<DialogFooter showCloseButton>
					<Button onClick={handleSave} disabled={isSaving || bookFiles.length === 0}>
						{isSaving ? (
							<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
						) : (
							"Save Changes"
						)}
					</Button>
				</DialogFooter>
			</DialogContentFullscreen>
		</Dialog>
	);
}
