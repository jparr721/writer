"use client";

import type { ColumnDef } from "@tanstack/react-table";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookFileResponse } from "@/app/api/schemas";
import { Button } from "@/components/ui/button";
import { DraggableTable } from "@/components/ui/draggable-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useBookContext, useSummarize, useUpsertDocumentSummary } from "@/hooks/use-ai-tools";
import { useBook } from "@/hooks/use-book";
import { useLibrary } from "@/hooks/use-library";
import { usePrompts } from "@/hooks/use-prompts";
import { Spinner } from "./ui/spinner";

type NodeType = "chapter" | "appendix" | "frontmatter" | "backmatter";

type EnrichedBookFile = BookFileResponse & {
	title: string;
	summary: string | null;
};

type BookContentProps = {
	workspaceId: string;
};

const NODE_TYPE_LABELS: Record<NodeType, string> = {
	chapter: "Chapter",
	frontmatter: "Frontmatter",
	backmatter: "Backmatter",
	appendix: "Appendix",
};

export default function BookContent({ workspaceId }: BookContentProps) {
	const { data: book, isLoading: bookLoading, refetch: refetchBook } = useBook(workspaceId);
	const { data: library } = useLibrary(workspaceId);
	const { data: bookContext, refetch: refetchContext } = useBookContext(workspaceId);
	const { prompts } = usePrompts();
	const summarize = useSummarize(workspaceId);
	const upsertSummary = useUpsertDocumentSummary(workspaceId);

	const [bookFiles, setBookFiles] = useState<EnrichedBookFile[]>([]);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);

	// Summary editing state
	const [editingFile, setEditingFile] = useState<EnrichedBookFile | null>(null);
	const [summaryDraft, setSummaryDraft] = useState("");
	const [isSavingSummary, setIsSavingSummary] = useState(false);

	// Generation progress state
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationProgress, setGenerationProgress] = useState<{
		current: number;
		total: number;
	} | null>(null);

	// Enrich book files with titles and summaries
	useEffect(() => {
		if (!book?.files || !library) return;

		const docMap = new Map(library.documents.map((d) => [d.id, d.title]));
		const summaryMap = new Map(bookContext?.map((c) => [c.filePath, c.summary]) ?? []);

		const enriched = book.files.map((f) => ({
			...f,
			title: docMap.get(f.filePath) || f.filePath.split("/").pop() || "Unknown",
			summary: summaryMap.get(f.filePath) ?? null,
		}));

		setBookFiles(enriched);
		setSelectedIds(enriched.map((f) => f.id));
		setHasChanges(false);
	}, [book, library, bookContext]);

	const updateNodeType = useCallback((id: string, nodeType: NodeType) => {
		setBookFiles((prev) => prev.map((f) => (f.id === id ? { ...f, nodeType } : f)));
		setHasChanges(true);
	}, []);

	const handleReorder = useCallback((newFiles: EnrichedBookFile[]) => {
		setBookFiles(newFiles);
		setHasChanges(true);
	}, []);

	const handleSaveOrder = useCallback(async () => {
		setIsSaving(true);
		try {
			const selectedFiles = bookFiles.filter((f) => selectedIds.includes(f.id));
			const files = selectedFiles.map((f, index) => ({
				filePath: f.filePath,
				nodeType: f.nodeType,
				position: index,
			}));

			await axios.post(`/api/workspace/${workspaceId}/book`, { files });
			setHasChanges(false);
			refetchBook();
		} catch (error) {
			console.error("Failed to save book order", error);
		} finally {
			setIsSaving(false);
		}
	}, [bookFiles, selectedIds, workspaceId, refetchBook]);

	// Summary editing handlers
	const handleOpenSummaryEditor = useCallback((file: EnrichedBookFile) => {
		setEditingFile(file);
		setSummaryDraft(file.summary ?? "");
	}, []);

	const handleCloseSummaryEditor = useCallback(() => {
		setEditingFile(null);
		setSummaryDraft("");
	}, []);

	const handleSaveSummary = useCallback(async () => {
		if (!editingFile) return;

		setIsSavingSummary(true);
		try {
			await upsertSummary.mutateAsync({
				filePath: editingFile.filePath,
				summary: summaryDraft,
			});

			// Update local state
			setBookFiles((prev) =>
				prev.map((f) => (f.id === editingFile.id ? { ...f, summary: summaryDraft } : f))
			);

			handleCloseSummaryEditor();
			refetchContext();
		} catch (error) {
			console.error("Failed to save summary", error);
		} finally {
			setIsSavingSummary(false);
		}
	}, [editingFile, summaryDraft, upsertSummary, handleCloseSummaryEditor, refetchContext]);

	// Summary generation
	const handleGenerateSummaries = useCallback(async () => {
		const docsToSummarize = bookFiles.filter((f) => selectedIds.includes(f.id) && !f.summary);

		if (docsToSummarize.length === 0) return;

		setIsGenerating(true);
		setGenerationProgress({ current: 0, total: docsToSummarize.length });

		try {
			for (let i = 0; i < docsToSummarize.length; i++) {
				setGenerationProgress({ current: i + 1, total: docsToSummarize.length });

				const file = docsToSummarize[i];

				// Fetch document content
				// TODO: Filesystem refactor - this endpoint is stubbed
				const { data: doc } = await axios.get(
					`/api/workspace/${workspaceId}/documents/${encodeURIComponent(file.filePath)}`
				);

				// Generate summary
				const result = await summarize.mutateAsync({
					filePath: file.filePath,
					content: doc.content ?? "",
					promptContent: prompts.summarizer,
				});

				// Update local state immediately
				setBookFiles((prev) =>
					prev.map((f) => (f.filePath === file.filePath ? { ...f, summary: result.summary } : f))
				);
			}

			refetchContext();
		} catch (error) {
			console.error("Failed to generate summaries", error);
		} finally {
			setIsGenerating(false);
			setGenerationProgress(null);
		}
	}, [bookFiles, selectedIds, workspaceId, summarize, prompts.summarizer, refetchContext]);

	const columns = useMemo<ColumnDef<EnrichedBookFile>[]>(
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
			{
				accessorKey: "summary",
				header: "Summary",
				cell: ({ row }) =>
					row.original.summary ? (
						<Button
							variant="outline"
							size="sm"
							onClick={(e) => {
								e.stopPropagation();
								handleOpenSummaryEditor(row.original);
							}}
							onPointerDown={(e) => e.stopPropagation()}
						>
							View/Edit
						</Button>
					) : (
						<span className="text-muted-foreground">None</span>
					),
			},
		],
		[bookFiles, updateNodeType, handleOpenSummaryEditor]
	);

	const selectedWithoutSummary = bookFiles.filter(
		(f) => selectedIds.includes(f.id) && !f.summary
	).length;

	if (bookLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spinner />
			</div>
		);
	}

	if (!book?.files.length) {
		return (
			<div className="py-12 text-center text-muted-foreground">
				No book structure defined yet. Go back and use Create Book to set one up.
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Action buttons */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					onClick={handleGenerateSummaries}
					disabled={selectedWithoutSummary === 0 || isGenerating}
				>
					{isGenerating && generationProgress
						? `Generating ${generationProgress.current}/${generationProgress.total}...`
						: `Generate Summaries${selectedWithoutSummary > 0 ? ` (${selectedWithoutSummary})` : ""}`}
				</Button>
				<Button variant="outline" onClick={handleSaveOrder} disabled={!hasChanges || isSaving}>
					{isSaving ? <Spinner /> : "Save Order"}
				</Button>
			</div>

			{/* Selection info */}
			<div className="text-sm text-muted-foreground">
				{selectedIds.length} of {bookFiles.length} chapters selected
				{selectedWithoutSummary > 0 && ` (${selectedWithoutSummary} without summaries)`}
			</div>

			{/* Draggable table */}
			<div>
				<DraggableTable
					data={bookFiles}
					columns={columns}
					getRowId={(row) => row.id}
					selectedIds={selectedIds}
					onSelectionChange={setSelectedIds}
					onReorder={handleReorder}
				/>
			</div>

			{/* Summary editor sheet */}
			<Sheet
				open={editingFile !== null}
				onOpenChange={(open) => !open && handleCloseSummaryEditor()}
			>
				<SheetContent side="right" className="w-full sm:max-w-lg">
					<SheetHeader>
						<SheetTitle>Edit Summary</SheetTitle>
						<SheetDescription>{editingFile?.title}</SheetDescription>
					</SheetHeader>
					<div className="flex-1 overflow-auto p-4">
						<Textarea
							value={summaryDraft}
							onChange={(e) => setSummaryDraft(e.target.value)}
							placeholder="Enter chapter summary..."
							className="min-h-[300px] font-mono text-sm"
						/>
					</div>
					<SheetFooter>
						<Button variant="outline" onClick={handleCloseSummaryEditor} disabled={isSavingSummary}>
							Cancel
						</Button>
						<Button onClick={handleSaveSummary} disabled={isSavingSummary}>
							{isSavingSummary ? <Spinner /> : "Save"}
						</Button>
					</SheetFooter>
				</SheetContent>
			</Sheet>
		</div>
	);
}
