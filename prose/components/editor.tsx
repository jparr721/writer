// CodeMirror editor wrapper for editing document content
"use client";

import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon, Mic01Icon, MicOff01Icon } from "@hugeicons/core-free-icons";
import { useWhisp } from "@/hooks/use-whisp";

type EditorProps = {
	title?: string;
	value: string;
	onChange: (value: string) => void;
	onSave?: () => Promise<void> | void;
	isSaving?: boolean;
	disabled?: boolean;
};

export default function Editor({
	title,
	value,
	onChange,
	onSave,
	isSaving,
	disabled,
}: EditorProps) {
	const [localSaving, setLocalSaving] = useState(false);
	const saving = isSaving ?? localSaving;
	const editorRef = useRef<ReactCodeMirrorRef>(null);
	const { isRecording, text, start, stop } = useWhisp();

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
		<div className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-center justify-between gap-3">
				<div>
					<p className="text-xs text-muted-foreground">Editing</p>
					<h2 className="text-lg font-semibold leading-tight">{title ?? "Untitled"}</h2>
				</div>
				<div className="flex gap-2">
					<Button
						variant={isRecording ? "destructive" : "outline"}
						size="icon"
						onClick={isRecording ? stop : start}
						disabled={disabled}
					>
						<HugeiconsIcon icon={isRecording ? MicOff01Icon : Mic01Icon} className="size-4" />
					</Button>
					{onSave && (
						<Button onClick={handleSave} disabled={disabled || saving}>
							{saving ? <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" /> : "Save"}
						</Button>
					)}
				</div>
			</div>
			<div className="flex-1 rounded-md border">
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
		</div>
	);
}
