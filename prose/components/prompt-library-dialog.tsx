"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { usePrompts } from "@/hooks/use-prompts";
import type { PromptCategory } from "@/lib/prompts/types";

type PromptLibraryDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function PromptLibraryDialog({ open, onOpenChange }: PromptLibraryDialogProps) {
	const { prompts, getPromptsByCategory, updatePrompt, resetPrompt, resetAll } = usePrompts();
	const [activeCategory, setActiveCategory] = useState<PromptCategory>("editor");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draft, setDraft] = useState("");

	const promptList = useMemo(
		() => getPromptsByCategory(activeCategory),
		[activeCategory, getPromptsByCategory]
	);

	// Compute the current selected prompt (derived state)
	const selectedPrompt = useMemo(() => {
		// Auto-select first prompt if none selected or if category changed
		const currentId = selectedId ?? promptList[0]?.id ?? null;
		return prompts[currentId] ?? null;
	}, [selectedId, promptList, prompts]);

	// Update draft when selected prompt changes
	const currentDraft = useMemo(() => {
		return selectedPrompt?.content ?? "";
	}, [selectedPrompt]);

	// Sync draft state with computed draft when prompt changes
	useEffect(() => {
		setDraft(currentDraft);
	}, [currentDraft]);

	const handleCategoryChange = (category: PromptCategory) => {
		setActiveCategory(category);
		setSelectedId(null); // Reset selection when switching categories
	};

	const handleSelectPrompt = (id: string) => {
		setSelectedId(id);
	};

	const handleSave = () => {
		const id = selectedId ?? promptList[0]?.id;
		if (!id) return;
		updatePrompt(id, draft);
	};

	const handleReset = () => {
		const id = selectedId ?? promptList[0]?.id;
		if (!id) return;
		resetPrompt(id);
	};

	const activePromptId = selectedId ?? promptList[0]?.id ?? null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-[90vw] max-w-[80vw] sm:max-w-[80vw] lg:max-w-[80vw] max-h-[60vh]">
				<DialogHeader>
					<DialogTitle>Prompt Library</DialogTitle>
					<DialogDescription>
						Edit and organize prompts by category. Changes are stored locally for this browser.
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
						<div className="grid gap-3 md:grid-cols-[250px_1fr]">
							<div className="rounded-md border p-2">
								<ScrollArea className="h-[60vh]">
									<div className="flex flex-col gap-1">
										{promptList.map((prompt) => (
											<Button
												key={prompt.id}
												variant={prompt.id === activePromptId ? "secondary" : "ghost"}
												className="justify-start"
												onClick={() => handleSelectPrompt(prompt.id)}
											>
												{prompt.name}
											</Button>
										))}
										{!promptList.length && (
											<p className="text-xs text-muted-foreground">No prompts in this category.</p>
										)}
									</div>
								</ScrollArea>
							</div>
							<div className="flex flex-col gap-2">
								<Textarea
									value={draft}
									onChange={(event) => setDraft(event.target.value)}
									placeholder="Select a prompt to edit"
								/>
								<div className="flex flex-wrap items-center justify-between gap-2">
									<Button variant="ghost" onClick={handleReset} disabled={!activePromptId}>
										Reset to default
									</Button>
									<div className="flex gap-2">
										<Button variant="outline" onClick={resetAll}>
											Reset all
										</Button>
										<Button onClick={handleSave} disabled={!activePromptId}>
											Save
										</Button>
									</div>
								</div>
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
