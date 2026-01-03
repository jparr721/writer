// CodeMirror editor wrapper for editing document content
"use client";

import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

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

	const extensions = useMemo(() => [markdown(), latex()], []);

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
				{onSave && (
					<Button onClick={handleSave} disabled={disabled || saving}>
						{saving ? "Saving..." : "Save"}
					</Button>
				)}
			</div>
			<div className="flex-1 rounded-md border">
				<CodeMirror
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
