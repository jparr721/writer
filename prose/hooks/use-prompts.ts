"use client";

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "usehooks-ts";
import { defaultPrompts } from "@/lib/prompts/defaults";
import type { PromptCategory, PromptLibrary } from "@/lib/prompts/types";

const STORAGE_KEY = "prompt-library-v2";

const mergeWithDefaults = (library?: Partial<PromptLibrary> | null): PromptLibrary => {
	if (!library) return { ...defaultPrompts };
	return {
		editor: library.editor ?? defaultPrompts.editor,
		helper: library.helper ?? defaultPrompts.helper,
		checker: library.checker ?? defaultPrompts.checker,
	};
};

export function usePrompts() {
	const [storedPrompts, setStoredPrompts] = useLocalStorage<PromptLibrary>(
		STORAGE_KEY,
		defaultPrompts,
		{
			deserializer: (value) => {
				try {
					const parsed = JSON.parse(value) as Partial<PromptLibrary>;
					return mergeWithDefaults(parsed);
				} catch {
					return { ...defaultPrompts };
				}
			},
		}
	);

	const prompts = useMemo(() => mergeWithDefaults(storedPrompts), [storedPrompts]);

	const updatePrompt = useCallback(
		(category: PromptCategory, content: string) => {
			setStoredPrompts((prev) => ({
				...mergeWithDefaults(prev),
				[category]: content,
			}));
		},
		[setStoredPrompts]
	);

	const resetPrompt = useCallback(
		(category: PromptCategory) => {
			setStoredPrompts((prev) => ({
				...mergeWithDefaults(prev),
				[category]: defaultPrompts[category],
			}));
		},
		[setStoredPrompts]
	);

	const resetAll = useCallback(() => {
		setStoredPrompts({ ...defaultPrompts });
	}, [setStoredPrompts]);

	return {
		prompts,
		updatePrompt,
		resetPrompt,
		resetAll,
	};
}
