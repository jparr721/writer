"use client";

export type PromptCategory = "editor" | "helper" | "checker";

export type Prompt = {
	id: string;
	name: string;
	category: PromptCategory;
	content: string;
};

export type PromptLibrary = Record<string, Prompt>;

export const PROMPT_CATEGORIES: PromptCategory[] = ["editor", "helper", "checker"];
