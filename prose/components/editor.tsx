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
import { EditorDiffDialog } from "@/components/editor-diff-dialog";
import { PdfPreview } from "@/components/pdf-preview";
import { Button } from "@/components/ui/button";
import { useWhisp } from "@/hooks/use-whisp";
import AIPanel from "./ai-panel";

type ViewMode = "editor" | "split" | "pdf";

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
}: EditorProps) {
	const [localSaving, setLocalSaving] = useState(false);
	const [viewMode, setViewMode] = useState<ViewMode>("split");
	const saving = isSaving ?? localSaving;
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	const { isRecording, text, start, stop } = useWhisp();
	const hasDiff = baseValue !== undefined && value !== baseValue;

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

	const extensions = useMemo(() => [markdown(), latex(), EditorView.lineWrapping], []);

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
		<div className="flex flex-1 flex-col min-h-0 gap-3 p-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs text-muted-foreground">Editing</p>
					<h2 className="text-lg font-semibold leading-tight">{title ?? "Untitled"}</h2>
				</div>
				<div className="flex gap-2">
					<div className="flex rounded-md border p-0.5">
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
			<div className="flex flex-1 min-h-0 gap-2">
				{viewMode !== "pdf" && (
					<div
						className={`min-h-0 rounded-md border overflow-y-auto ${viewMode === "split" ? "w-1/2" : "w-full"}`}
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
					</div>
				)}
				{viewMode !== "editor" && (
					<div
						className={`min-h-0 rounded-md border overflow-hidden ${viewMode === "split" ? "w-1/2" : "w-full"}`}
					>
						<PdfPreview
							pdfBlob={pdfBlob ?? null}
							isLoading={isCompiling ?? false}
							error={compileError ?? null}
						/>
					</div>
				)}
			</div>
			<div className="flex flex-col gap-3">
				<AIPanel />
			</div>
		</div>
	);
}
