// TODO: Filesystem refactor - now uses filePath instead of documentId
"use client";

import { useLocalStorage } from "usehooks-ts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsistencyCheckSection } from "./ai/consistency-check-section";
import { EditorPassSection } from "./ai/editor-pass-section";
import { HelpSection } from "./ai/help-section";

type AIPanelProps = {
	workspaceId: string;
	filePath: string;
	content: string;
	hasDraftChanges: boolean;
	onContentChange: (content: string) => void;
	onSaveAndContinue: () => Promise<void>;
};

export default function AIPanel({
	workspaceId,
	filePath,
	content,
	hasDraftChanges,
	onContentChange,
	onSaveAndContinue,
}: AIPanelProps) {
	const [activeTab, setActiveTab] = useLocalStorage("ai-panel-tab", "editor");

	const handleApplyFix = (original: string, fixed: string) => {
		const newContent = content.replace(original, fixed);
		onContentChange(newContent);
	};

	return (
		<div className="flex flex-col h-full border-t pt-2 min-h-0">
			<Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
				<TabsList>
					<TabsTrigger value="editor">Editor Pass</TabsTrigger>
					<TabsTrigger value="help">Help</TabsTrigger>
					<TabsTrigger value="checker">Consistency</TabsTrigger>
				</TabsList>

				<TabsContent value="editor" className="flex-1 min-h-0">
					<EditorPassSection
						workspaceId={workspaceId}
						filePath={filePath}
						content={content}
						hasDraftChanges={hasDraftChanges}
						onContentChange={onContentChange}
						onSaveAndContinue={onSaveAndContinue}
					/>
				</TabsContent>

				<TabsContent value="help" className="flex-1 min-h-0 flex flex-col">
					<HelpSection workspaceId={workspaceId} filePath={filePath} content={content} />
				</TabsContent>

				<TabsContent value="checker" className="flex-1 min-h-0 flex flex-col">
					<ConsistencyCheckSection
						workspaceId={workspaceId}
						filePath={filePath}
						content={content}
						onApplyFix={handleApplyFix}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
}
