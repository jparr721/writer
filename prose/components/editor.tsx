// CodeMirror editor wrapper for editing document content
"use client";

import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import {
	LeftToRightBlockQuoteIcon,
	Loading03Icon,
	Mic01Icon,
	MicOff01Icon,
	Pdf01Icon,
	SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { EditorDiffDialog } from "@/components/editor-diff-dialog";
import { PdfPreview } from "@/components/pdf-preview";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
} from "@/components/ui/popover";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Textarea } from "@/components/ui/textarea";
import { useBookContext, useRewriter } from "@/hooks/use-ai-tools";
import { usePrompts } from "@/hooks/use-prompts";
import { useWhisp } from "@/hooks/use-whisp";
import AIPanel from "./ai-panel";

const VIEW_MODE_KEY = "writer-view-mode";
type ViewMode = "editor" | "split" | "pdf";

// TODO: Filesystem refactor - now uses filePath instead of documentId
type EditorProps = {
	title?: string;
	value: string;
	baseValue?: string;
	diffFilename?: string;
	onChange: (value: string) => void;
	onSave?: () => Promise<void> | void;
	isSaving?: boolean;
	disabled?: boolean;
	pdfBlob?: Blob | null;
	isCompiling?: boolean;
	compileError?: Error | null;
	workspaceId?: string;
	filePath?: string;
};

export default function Editor({
	title,
	value,
	baseValue,
	diffFilename,
	onChange,
	onSave,
	isSaving,
	disabled,
	pdfBlob,
	isCompiling,
	compileError,
	workspaceId,
	filePath,
}: EditorProps) {
	const [localSaving, setLocalSaving] = useState(false);
	const [viewMode, setViewMode] = useLocalStorage<ViewMode>(VIEW_MODE_KEY, "split");
	const saving = isSaving ?? localSaving;
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const { isRecording, text, start, stop } = useWhisp();
	const hasDiff = baseValue !== undefined && value !== baseValue;

	// Selection rewrite state
	const [selection, setSelection] = useState<{ text: string; from: number; to: number } | null>(
		null
	);
	const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
	const [rewriteInstructions, setRewriteInstructions] = useState("");
	const rewriter = useRewriter(workspaceId);
	const { prompts } = usePrompts();
	const { data: bookContextData } = useBookContext(workspaceId);

	// Format book context for rewriter
	const formattedBookContext = useMemo(() => {
		if (!bookContextData) return "No book context provided.";
		return bookContextData.map((item) => `## ${item.title}\n${item.summary}`).join("\n\n");
	}, [bookContextData]);

	// Insert transcribed text at cursor position and move cursor to end
	useEffect(() => {
		if (!text || !editorRef.current?.view) return;
		const view = editorRef.current.view;
		const pos = view.state.selection.main.head;
		view.dispatch({
			changes: { from: pos, insert: text },
			selection: { anchor: pos + text.length },
		});
	}, [text]);

	// Selection tracking for rewrite popover (debounced)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const selectionExtension = useMemo(
		() =>
			EditorView.updateListener.of((update) => {
				// Only process if selection actually changed
				if (!update.selectionSet) return;

				// Clear any pending debounce
				if (debounceRef.current) {
					clearTimeout(debounceRef.current);
				}

				const sel = update.state.selection.main;
				if (sel.empty) {
					// Clear selection immediately when deselected
					setSelection(null);
					return;
				}

				// Debounce the selection update
				debounceRef.current = setTimeout(() => {
					const selectedText = update.state.sliceDoc(sel.from, sel.to);
					const coords = update.view.coordsAtPos(sel.from);
					if (coords && editorContainerRef.current) {
						const containerRect = editorContainerRef.current.getBoundingClientRect();
						setSelection({ text: selectedText, from: sel.from, to: sel.to });
						setAnchorPos({
							x: coords.left - containerRect.left,
							y: coords.bottom - containerRect.top,
						});
					}
				}, 500);
			}),
		[]
	);

	const extensions = useMemo(
		() => [markdown(), latex(), EditorView.lineWrapping, selectionExtension],
		[selectionExtension]
	);

	const handleRewrite = async () => {
		if (!selection || !filePath) return;
		try {
			const result = await rewriter.mutateAsync({
				filePath,
				selectedText: selection.text,
				instructions: rewriteInstructions,
				bookContext: formattedBookContext,
				promptContent: prompts.rewriter,
				currentChapter: baseValue ?? "No chapter content provided.",
			});
			// Replace the exact range in the content
			const newContent =
				value.slice(0, selection.from) + result.rewrittenText + value.slice(selection.to);
			onChange(newContent);
			setSelection(null);
			setRewriteInstructions("");
		} catch (error) {
			console.error("Rewrite failed:", error);
		}
	};

	const handleSave = async () => {
		if (!onSave) return;
		setLocalSaving(true);
		try {
			await onSave();
		} finally {
			setLocalSaving(false);
		}
	};

	return (
		<ResizablePanelGroup
			direction="vertical"
			autoSaveId="writer-editor-panel-sizes"
			className="flex flex-1 flex-col min-h-0"
		>
			<ResizablePanel defaultSize={70} minSize={30}>
				<div className="flex flex-col h-full gap-3">
					<div className="flex items-center justify-between gap-3">
						<div>
							<p className="text-xs text-muted-foreground">Editing</p>
							<h2 className="text-lg font-semibold leading-tight">{title ?? "Untitled"}</h2>
						</div>
						<div className="flex gap-2">
							<div className="flex">
								<Button
									variant={viewMode === "editor" ? "secondary" : "ghost"}
									size="icon"
									className="size-7"
									onClick={() => setViewMode("editor")}
									title="Editor only"
								>
									<HugeiconsIcon icon={SourceCodeIcon} className="size-4" />
								</Button>
								<Button
									variant={viewMode === "split" ? "secondary" : "ghost"}
									size="icon"
									className="size-7"
									onClick={() => setViewMode("split")}
									title="Split view"
								>
									<HugeiconsIcon icon={LeftToRightBlockQuoteIcon} className="size-4" />
								</Button>
								<Button
									variant={viewMode === "pdf" ? "secondary" : "ghost"}
									size="icon"
									className="size-7"
									onClick={() => setViewMode("pdf")}
									title="PDF only"
								>
									<HugeiconsIcon icon={Pdf01Icon} className="size-4" />
								</Button>
							</div>
							<Button
								variant={isRecording ? "destructive" : "outline"}
								size="icon"
								onClick={isRecording ? stop : start}
								disabled={disabled}
							>
								<HugeiconsIcon icon={isRecording ? MicOff01Icon : Mic01Icon} className="size-4" />
							</Button>
							{onSave && (
								<>
									<EditorDiffDialog
										baseValue={baseValue ?? ""}
										value={value}
										filename={diffFilename}
										hasChanges={hasDiff}
										disabled={!hasDiff || disabled}
										onDiscard={() => onChange(baseValue ?? "")}
									/>
									<Button onClick={handleSave} disabled={disabled || saving}>
										{saving ? (
											<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
										) : (
											"Save"
										)}
									</Button>
								</>
							)}
						</div>
					</div>
					<div className="flex flex-1 min-h-0">
						{viewMode !== "pdf" && (
							<div
								ref={editorContainerRef}
								className={`relative min-h-0 overflow-y-auto ${viewMode === "split" ? "w-1/2" : "w-full"}`}
							>
								<CodeMirror
									ref={editorRef}
									value={value}
									height="100%"
									extensions={extensions}
									theme={oneDark}
									onChange={(val) => onChange(val)}
									basicSetup={{ lineNumbers: true }}
									editable={!disabled}
								/>
								{/* Selection Rewrite Popover */}
								<Popover
									open={!!selection && !!workspaceId && !!filePath}
									onOpenChange={(open) => {
										if (!open) {
											setSelection(null);
											setRewriteInstructions("");
										}
									}}
								>
									<PopoverAnchor
										style={{
											position: "absolute",
											left: anchorPos.x,
											top: anchorPos.y,
											width: 0,
											height: 0,
										}}
									/>
									<PopoverContent className="w-80">
										<PopoverHeader>
											<PopoverTitle>Rewrite Selection</PopoverTitle>
											<PopoverDescription>
												Describe how you want this text rewritten.
											</PopoverDescription>
										</PopoverHeader>
										<Textarea
											value={rewriteInstructions}
											onChange={(e) => setRewriteInstructions(e.target.value)}
											placeholder="Make it more concise..."
											className="min-h-20"
										/>
										<Button
											onClick={handleRewrite}
											disabled={rewriter.isPending || !rewriteInstructions.trim()}
											className="w-full"
										>
											{rewriter.isPending ? (
												<HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
											) : (
												"Rewrite"
											)}
										</Button>
									</PopoverContent>
								</Popover>
							</div>
						)}
						{viewMode !== "editor" && (
							<div
								className={`min-h-0 overflow-hidden ${viewMode === "split" ? "w-1/2" : "w-full"}`}
							>
								<PdfPreview
									pdfBlob={pdfBlob ?? null}
									isLoading={isCompiling ?? false}
									error={compileError ?? null}
								/>
							</div>
						)}
					</div>
				</div>
			</ResizablePanel>
			{workspaceId && filePath && (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={30} minSize={10}>
						<div className="flex flex-col h-full pt-3 overflow-hidden">
							<AIPanel
								workspaceId={workspaceId}
								filePath={filePath}
								content={value}
								hasDraftChanges={hasDiff}
								onContentChange={onChange}
								onSaveAndContinue={handleSave}
							/>
						</div>
					</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}
