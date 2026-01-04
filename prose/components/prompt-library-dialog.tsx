"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePrompts } from "@/hooks/use-prompts";
import type { PromptCategory } from "@/lib/prompts/types";

type PromptLibraryDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function PromptLibraryDialog({ open, onOpenChange }: PromptLibraryDialogProps) {
	const { prompts, updatePrompt, resetPrompt, resetAll } = usePrompts();
	const [activeCategory, setActiveCategory] = useState<PromptCategory>("editor");
	const [draft, setDraft] = useState("");

	// Sync draft with active category's prompt
	useEffect(() => {
		setDraft(prompts[activeCategory]);
	}, [activeCategory, prompts]);

	const handleCategoryChange = (category: PromptCategory) => {
		setActiveCategory(category);
	};

	const handleSave = () => {
		updatePrompt(activeCategory, draft);
	};

	const handleReset = () => {
		resetPrompt(activeCategory);
	};

	const hasChanges = draft !== prompts[activeCategory];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[90vw] max-w-[80vw] sm:max-w-[80vw] lg:max-w-[80vw] max-h-[80vh]">
				<DialogHeader>
					<DialogTitle>Prompt Library</DialogTitle>
					<DialogDescription>
						Edit prompts by category. Changes are stored locally for this browser.
					</DialogDescription>
				</DialogHeader>
				<Tabs
					value={activeCategory}
					onValueChange={(value) => handleCategoryChange(value as PromptCategory)}
					className="flex flex-col gap-3"
				>
					<TabsList>
						<TabsTrigger value="editor">Editor</TabsTrigger>
						<TabsTrigger value="helper">Helper</TabsTrigger>
						<TabsTrigger value="checker">Checker</TabsTrigger>
					</TabsList>
					<TabsContent value={activeCategory} className="flex flex-col gap-3">
						<Textarea
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							placeholder="Enter prompt content..."
							className="min-h-[40vh] font-mono text-sm"
						/>
						<div className="flex flex-wrap items-center justify-between gap-2">
							<Button variant="ghost" onClick={handleReset}>
								Reset to default
							</Button>
							<div className="flex gap-2">
								<Button variant="outline" onClick={resetAll}>
									Reset all
								</Button>
								<Button onClick={handleSave} disabled={!hasChanges}>
									Save
								</Button>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
