"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { defaultPrompts } from "@/lib/prompts/defaults";
import type { Prompt, PromptCategory, PromptLibrary } from "@/lib/prompts/types";

const STORAGE_KEY = "prompt-library";

const mergeWithDefaults = (library?: PromptLibrary | null): PromptLibrary => {
	const merged: PromptLibrary = { ...defaultPrompts };
	if (!library) return merged;
	for (const [id, prompt] of Object.entries(library)) {
		merged[id] = prompt;
	}
	return merged;
};

export function usePrompts() {
	const [storedPrompts, setStoredPrompts] = useLocalStorage<PromptLibrary>(
		STORAGE_KEY,
		defaultPrompts,
		{
			deserializer: (value) => {
				try {
					const parsed = JSON.parse(value) as PromptLibrary;
					return mergeWithDefaults(parsed);
				} catch {
					return defaultPrompts;
				}
			},
		}
	);

	const prompts = useMemo(() => mergeWithDefaults(storedPrompts), [storedPrompts]);

	const getPromptsByCategory = useCallback(
		(category: PromptCategory): Prompt[] =>
			Object.values(prompts).filter((prompt) => prompt.category === category),
		[prompts]
	);

	const updatePrompt = useCallback(
		(id: string, content: string) => {
			setStoredPrompts((prev) => {
				const merged = mergeWithDefaults(prev);
				const existing = merged[id];
				if (!existing) return merged;
				return {
					...merged,
					[id]: {
						...existing,
						content,
					},
				};
			});
		},
		[setStoredPrompts]
	);

	const resetPrompt = useCallback(
		(id: string) => {
			setStoredPrompts((prev) => {
				const merged = mergeWithDefaults(prev);
				if (defaultPrompts[id]) {
					return { ...merged, [id]: defaultPrompts[id] };
				}
				const next = { ...merged };
				delete next[id];
				return next;
			});
		},
		[setStoredPrompts]
	);

	const resetAll = useCallback(() => {
		setStoredPrompts(defaultPrompts);
	}, [setStoredPrompts]);

	return {
		prompts,
		getPromptsByCategory,
		updatePrompt,
		resetPrompt,
		resetAll,
	};
}
