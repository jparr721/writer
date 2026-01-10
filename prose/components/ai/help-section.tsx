"use client";

import { ArrowRight01Icon, Idea01Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContentFullscreen,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
	useBookContext,
	useHelper,
	useHelpSuggestions,
	useUpdateHelpSuggestion,
} from "@/hooks/use-ai-tools";
import { usePrompts } from "@/hooks/use-prompts";
import type { HelpSuggestion } from "@/lib/db/schema";
import { Label } from "../ui/label";

// TODO: Filesystem refactor - now uses filePath instead of documentId
type HelpSectionProps = {
	workspaceId: string;
	filePath: string;
	content: string;
};

function HelpInputDialog({
	workspaceId,
	filePath,
	content,
	onSuccess,
}: {
	workspaceId: string;
	filePath: string;
	content: string;
	onSuccess: () => void;
}) {
	const [open, setOpen] = useState(false);
	const [specificRequests, setSpecificRequests] = useState("");
	const helper = useHelper(workspaceId);
	const { data: bookContext = [] } = useBookContext(workspaceId);
	const { prompts } = usePrompts();

	const handleSubmit = async () => {
		const contextText = bookContext.map((c) => `## ${c.title}\n${c.summary}`).join("\n\n");

		await helper.mutateAsync({
			filePath,
			content,
			bookContext: contextText,
			specificRequests,
			promptContent: prompts.helper,
		});

		setOpen(false);
		setSpecificRequests("");
		onSuccess();
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<HugeiconsIcon icon={Idea01Icon} className="mr-2 size-4" />
					Get Help
				</Button>
			</DialogTrigger>
			<DialogContentFullscreen>
				<DialogHeader>
					<DialogTitle>Get Writing Help</DialogTitle>
					<DialogDescription>
						Get plot suggestions and writing assistance based on your current chapter.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					{bookContext.length > 0 && (
						<div>
							<span className="mb-1.5 block text-sm font-medium">Book Context</span>
							<div className="rounded-md border p-2 text-xs text-muted-foreground">
								Using {bookContext.length} chapter summaries as context
							</div>
						</div>
					)}
					<div>
						<label htmlFor="specific-requests" className="mb-1.5 block text-sm font-medium">
							Specific Requests
						</label>
						<Textarea
							id="specific-requests"
							value={specificRequests}
							onChange={(e) => setSpecificRequests(e.target.value)}
							placeholder="Any specific guidance or questions you have..."
							rows={3}
							disabled={helper.isPending}
						/>
					</div>
					<Button onClick={handleSubmit} disabled={helper.isPending}>
						{helper.isPending ? (
							<>
								<HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
								Generating...
							</>
						) : (
							"Generate Suggestions"
						)}
					</Button>
				</div>
			</DialogContentFullscreen>
		</Dialog>
	);
}

import { RadioGroup, RadioGroupItem } from "../ui/radio-group";

function HelpResultsDialog({
	suggestion,
	onClose,
}: {
	suggestion: HelpSuggestion;
	onClose: () => void;
}) {
	const [newChapterSteeringVisible, setNewChapterSteeringVisible] = useState(false);
	const [newChapterSteering, setNewChapterSteering] = useState("");
	const [continuationType, setContinuationType] = useState<"conservative" | "divergent">(
		"conservative"
	);

	// Applies the suggestion to the chapter using the LLM to do a full replacement of the chapter content
	const handleApplyToChapter = () => {};

	// Handler to set the continuation type from the string value RadioGroup gives
	const handleContinuationTypeChange = (value: string) => {
		if (value === "conservative" || value === "divergent") {
			setContinuationType(value);
		}
	};

	return (
		<Dialog open onOpenChange={(open) => !open && onClose()}>
			<DialogContentFullscreen>
				<DialogHeader>
					<DialogTitle>Writing Suggestion</DialogTitle>
					<DialogDescription>
						{suggestion.prompt || "Generated suggestion based on your chapter"}
					</DialogDescription>
				</DialogHeader>
				<ScrollArea className="max-h-[50vh] overflow-y-auto">
					<div className="whitespace-pre-wrap text-sm">{suggestion.response}</div>
				</ScrollArea>
				<div className="flex flex-col gap-4">
					<div>
						<Label className="mb-2 block text-sm font-medium">
							How should the suggestion change the chapter continuation?
						</Label>
						<RadioGroup
							value={continuationType}
							onValueChange={handleContinuationTypeChange}
							className="flex flex-col gap-2"
						>
							<div className="flex items-start gap-2">
								<RadioGroupItem value="conservative" id="continuation-conservative" />
								<div>
									<Label htmlFor="continuation-conservative" className="text-sm">
										Follow The Current Plot
									</Label>
									<div className="block text-xs text-muted-foreground">
										Stay close to the current plot direction and main events.
									</div>
								</div>
							</div>
							<div className="flex items-start gap-2">
								<RadioGroupItem value="divergent" id="continuation-divergent" />
								<div>
									<Label htmlFor="continuation-divergent" className="text-sm">
										Take A Different Path
									</Label>
									<div className="block text-xs text-muted-foreground">
										Allow for more significant changes or surprising turns.
									</div>
								</div>
							</div>
						</RadioGroup>
					</div>
					<div className="flex gap-2 items-center">
						<Label>Adjust The Suggestion Before Applying</Label>
						<Checkbox
							checked={newChapterSteeringVisible}
							onCheckedChange={(checked) =>
								setNewChapterSteeringVisible(checked === "indeterminate" ? false : checked)
							}
						/>
					</div>
					{newChapterSteeringVisible && (
						<Textarea
							value={newChapterSteering}
							onChange={(e) => setNewChapterSteering(e.target.value)}
							placeholder="Add specific guidance for the content"
						/>
					)}
				</div>
				<div className="flex justify-end gap-2 mt-2">
					<Button variant="outline" onClick={handleApplyToChapter}>
						<HugeiconsIcon icon={ArrowRight01Icon} className="mr-2 size-4" />
						Apply to Chapter
					</Button>
					<Button onClick={onClose}>Close</Button>
				</div>
			</DialogContentFullscreen>
		</Dialog>
	);
}

function HelpSuggestionItem({
	suggestion,
	workspaceId,
	filePath,
	onViewDetails,
}: {
	suggestion: HelpSuggestion;
	workspaceId: string;
	filePath: string;
	onViewDetails: () => void;
}) {
	const updateSuggestion = useUpdateHelpSuggestion(workspaceId);

	const handleToggleComplete = async () => {
		await updateSuggestion.mutateAsync({
			filePath,
			suggestionId: suggestion.id,
			completed: !suggestion.completed,
		});
	};

	// Truncate response for preview
	const preview =
		suggestion.response.slice(0, 100) + (suggestion.response.length > 100 ? "..." : "");

	return (
		<div
			className={`flex items-start gap-2 rounded-md border p-2 ${
				suggestion.completed ? "opacity-60" : ""
			}`}
		>
			<Checkbox
				checked={suggestion.completed}
				onCheckedChange={handleToggleComplete}
				className="mt-1"
			/>
			<div className="flex-1 min-w-0">
				<p className="text-xs text-muted-foreground mb-1">
					{suggestion.prompt || "General suggestion"}
				</p>
				<p className="text-sm truncate">{preview}</p>
			</div>
			<Button size="sm" variant="ghost" onClick={onViewDetails}>
				View
			</Button>
		</div>
	);
}

export function HelpSection({ workspaceId, filePath, content }: HelpSectionProps) {
	const { data: suggestions = [] } = useHelpSuggestions(workspaceId, filePath);
	const [selectedSuggestion, setSelectedSuggestion] = useState<HelpSuggestion | null>(null);

	const activeSuggestions = suggestions.filter((s) => !s.completed);
	const completedSuggestions = suggestions.filter((s) => s.completed);

	return (
		<div className="flex flex-col gap-2 h-full min-h-0">
			<div className="flex items-center justify-between shrink-0">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={Idea01Icon} className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium">Help</span>
					{activeSuggestions.length > 0 && (
						<Badge variant="secondary" className="text-xs">
							{activeSuggestions.length}
						</Badge>
					)}
				</div>
				<HelpInputDialog
					workspaceId={workspaceId}
					filePath={filePath}
					content={content}
					onSuccess={() => {}}
				/>
			</div>

			{suggestions.length > 0 ? (
				<div className="flex flex-1 flex-col gap-1 overflow-y-auto min-h-0">
					{activeSuggestions.map((suggestion) => (
						<HelpSuggestionItem
							key={suggestion.id}
							suggestion={suggestion}
							workspaceId={workspaceId}
							filePath={filePath}
							onViewDetails={() => setSelectedSuggestion(suggestion)}
						/>
					))}
					{completedSuggestions.length > 0 && (
						<details className="text-xs text-muted-foreground">
							<summary className="cursor-pointer py-1">
								{completedSuggestions.length} completed
							</summary>
							<div className="flex flex-col gap-1 pt-1">
								{completedSuggestions.map((suggestion) => (
									<HelpSuggestionItem
										key={suggestion.id}
										suggestion={suggestion}
										workspaceId={workspaceId}
										filePath={filePath}
										onViewDetails={() => setSelectedSuggestion(suggestion)}
									/>
								))}
							</div>
						</details>
					)}
				</div>
			) : (
				<div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
					<HugeiconsIcon icon={Idea01Icon} className="size-4" />
					<span>No suggestions yet. Click Get Help to get writing assistance.</span>
				</div>
			)}

			{selectedSuggestion && (
				<HelpResultsDialog
					suggestion={selectedSuggestion}
					onClose={() => setSelectedSuggestion(null)}
				/>
			)}
		</div>
	);
}
