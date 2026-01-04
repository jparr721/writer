"use client";

import { Loading03Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorPass } from "@/hooks/use-ai-tools";
import { usePrompts } from "@/hooks/use-prompts";
import { DraftWarningDialog } from "./draft-warning-dialog";
import { PromptSelector } from "./prompt-selector";

type EditorPassSectionProps = {
	workspaceId: string;
	documentId: string;
	content: string;
	hasDraftChanges: boolean;
	onContentChange: (content: string) => void;
	onSaveAndContinue: () => Promise<void>;
};

export function EditorPassSection({
	workspaceId,
	documentId,
	content,
	hasDraftChanges,
	onContentChange,
	onSaveAndContinue,
}: EditorPassSectionProps) {
	const [showWarning, setShowWarning] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [selectedPromptId, setSelectedPromptId] = useState<string | null>("editor-default");
	const editorPass = useEditorPass(workspaceId);
	const { prompts } = usePrompts();

	const handleRunEditorPass = async () => {
		if (hasDraftChanges) {
			setShowWarning(true);
			return;
		}
		await runEditorPass();
	};

	const runEditorPass = async () => {
		const promptContent = prompts[selectedPromptId ?? "editor-default"]?.content ?? "";
		const result = await editorPass.mutateAsync({
			documentId,
			content,
			promptContent,
		});
		onContentChange(result.editedContent);
	};

	const handleSaveAndContinue = async () => {
		setIsSaving(true);
		try {
			await onSaveAndContinue();
			setShowWarning(false);
			await runEditorPass();
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<HugeiconsIcon icon={PencilEdit01Icon} className="size-4 text-muted-foreground" />
				<span className="text-sm font-medium">Editor Pass</span>
			</div>
			<div className="flex gap-2">
				<div className="flex-1">
					<PromptSelector
						category="editor"
						value={selectedPromptId}
						onValueChange={setSelectedPromptId}
						disabled={editorPass.isPending}
					/>
				</div>
				<Button onClick={handleRunEditorPass} disabled={editorPass.isPending} size="sm">
					{editorPass.isPending ? (
						<>
							<HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
							Running...
						</>
					) : (
						"Run"
					)}
				</Button>
			</div>

			<DraftWarningDialog
				open={showWarning}
				onOpenChange={setShowWarning}
				onSaveAndContinue={handleSaveAndContinue}
				onCancel={() => setShowWarning(false)}
				isSaving={isSaving}
			/>
		</div>
	);
}
