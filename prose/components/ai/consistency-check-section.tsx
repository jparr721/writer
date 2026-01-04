"use client";

import {
	Alert02Icon,
	ArrowDown01Icon,
	CheckmarkCircle02Icon,
	Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useChecker, useConsistencyChecks } from "@/hooks/use-ai-tools";
import { usePrompts } from "@/hooks/use-prompts";
import type { ConsistencyCheck } from "@/lib/db/schema";

type ConsistencyCheckSectionProps = {
	workspaceId: string;
	documentId: string;
	content: string;
	onApplyFix: (original: string, fixed: string) => void;
};

const typeColors: Record<string, string> = {
	punctuation: "bg-blue-100 text-blue-800",
	repetition: "bg-amber-100 text-amber-800",
	tense: "bg-purple-100 text-purple-800",
};

function ConsistencyCheckItem({
	check,
	onApply,
}: {
	check: ConsistencyCheck;
	onApply: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Collapsible open={isOpen} onOpenChange={setIsOpen}>
			<div className="rounded-md border">
				<CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-2 text-left hover:bg-muted/50">
					<div className="flex items-center gap-2">
						<HugeiconsIcon
							icon={ArrowDown01Icon}
							className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
						/>
						<Badge variant="outline" className={typeColors[check.type]}>
							{check.type}
						</Badge>
						<span className="text-xs text-muted-foreground">Line {check.line}</span>
					</div>
					<span className="max-w-[200px] truncate text-sm">{check.original}</span>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<div className="border-t p-3 text-sm">
						<div className="mb-2 space-y-1">
							<div className="flex items-start gap-2">
								<span className="font-medium text-destructive">-</span>
								<span className="line-through text-muted-foreground">{check.original}</span>
							</div>
							<div className="flex items-start gap-2">
								<span className="font-medium text-green-600">+</span>
								<span className="text-green-700">{check.fixed}</span>
							</div>
						</div>
						<Button size="sm" variant="outline" onClick={onApply}>
							Apply Fix
						</Button>
					</div>
				</CollapsibleContent>
			</div>
		</Collapsible>
	);
}

export function ConsistencyCheckSection({
	workspaceId,
	documentId,
	content,
	onApplyFix,
}: ConsistencyCheckSectionProps) {
	const checker = useChecker(workspaceId);
	const { data: checks = [] } = useConsistencyChecks(workspaceId, documentId);
	const { prompts } = usePrompts();

	const handleRunChecker = async () => {
		const promptContent = prompts["checker-default"]?.content ?? "";
		try {
			await checker.mutateAsync({
				documentId,
				content,
				promptContent,
			});
		} catch (error) {
			console.error("Error running checker:", error);
		}
	};

	const activeChecks = checks.filter((c) => !c.acknowledged);

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 text-muted-foreground" />
					<span className="text-sm font-medium">Consistency Check</span>
					{activeChecks.length > 0 && (
						<Badge variant="secondary" className="text-xs">
							{activeChecks.length}
						</Badge>
					)}
				</div>
				<Button onClick={handleRunChecker} disabled={checker.isPending} size="sm" variant="outline">
					{checker.isPending ? (
						<>
							<HugeiconsIcon icon={Loading03Icon} className="mr-2 size-4 animate-spin" />
							Checking
						</>
					) : (
						"Run Check"
					)}
				</Button>
			</div>

			{activeChecks.length > 0 ? (
				<div className="flex max-h-[200px] flex-col gap-1 overflow-y-auto">
					{activeChecks.map((check) => (
						<ConsistencyCheckItem
							key={check.id}
							check={check}
							onApply={() => onApplyFix(check.original, check.fixed)}
						/>
					))}
				</div>
			) : (
				<div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
					<HugeiconsIcon icon={Alert02Icon} className="size-4" />
					<span>No issues found. Run a check to analyze your document.</span>
				</div>
			)}
		</div>
	);
}
