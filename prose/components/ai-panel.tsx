"use client";

import { Separator } from "@/components/ui/separator";
import { ConsistencyCheckSection } from "./ai/consistency-check-section";
import { EditorPassSection } from "./ai/editor-pass-section";
import { HelpSection } from "./ai/help-section";

type AIPanelProps = {
	workspaceId: string;
	documentId: string;
	content: string;
	baseContent: string;
	hasDraftChanges: boolean;
	onContentChange: (content: string) => void;
	onSaveAndContinue: () => Promise<void>;
};

export default function AIPanel({
	workspaceId,
	documentId,
	content,
	baseContent,
	hasDraftChanges,
	onContentChange,
	onSaveAndContinue,
}: AIPanelProps) {
	const handleApplyFix = (original: string, fixed: string) => {
		const newContent = content.replace(original, fixed);
		onContentChange(newContent);
	};

	return (
		<div className="border-t pt-2">
			<div className="grid gap-4 md:grid-cols-3">
				<EditorPassSection
					workspaceId={workspaceId}
					documentId={documentId}
					content={content}
					hasDraftChanges={hasDraftChanges}
					onContentChange={onContentChange}
					onSaveAndContinue={onSaveAndContinue}
				/>
				<HelpSection workspaceId={workspaceId} documentId={documentId} content={content} />
				<ConsistencyCheckSection
					workspaceId={workspaceId}
					documentId={documentId}
					content={content}
					onApplyFix={handleApplyFix}
				/>
			</div>
		</div>
	);
}
