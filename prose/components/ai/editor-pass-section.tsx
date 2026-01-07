"use client";

import { PencilEdit01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useEditorPass } from "@/hooks/use-ai-tools";
import { usePrompts } from "@/hooks/use-prompts";
import { Spinner } from "../ui/spinner";
import { DraftWarningDialog } from "./draft-warning-dialog";

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
		const result = await editorPass.mutateAsync({
			documentId,
			content,
			promptContent: prompts.editor,
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
		<div className="flex flex-col gap-2 h-full min-h-0">
			<div className="flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={PencilEdit01Icon} className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium">Editor Pass</span>
				</div>
				<Button onClick={handleRunEditorPass} disabled={editorPass.isPending} size="sm">
					{editorPass.isPending ? <Spinner /> : "Run"}
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
