"use client";

import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { usePrompts } from "@/hooks/use-prompts";
import type { PromptCategory } from "@/lib/prompts/types";

type PromptSelectorProps = {
	category: PromptCategory;
	value: string | null;
	onValueChange: (value: string) => void;
	disabled?: boolean;
};

export function PromptSelector({ category, value, onValueChange, disabled }: PromptSelectorProps) {
	const { getPromptsByCategory } = usePrompts();
	const prompts = useMemo(() => getPromptsByCategory(category), [category, getPromptsByCategory]);

	return (
		<Select value={value ?? undefined} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger className="w-full">
				<SelectValue placeholder="Select a prompt" />
			</SelectTrigger>
			<SelectContent>
				{prompts.map((prompt) => (
					<SelectItem key={prompt.id} value={prompt.id}>
						{prompt.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
